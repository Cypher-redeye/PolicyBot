from typing import List, Dict, Any, Optional
import time
import os
from pathlib import Path

from langchain_openai import AzureOpenAIEmbeddings, AzureChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.documents import Document
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

from config import RAGConfig
from supabase_logger import SupabaseLogger
from pgvector_store import PGVectorStore
from document_processor import DocumentProcessor
from bm25_retriever import BM25Retriever
from hybrid_retriever import HybridRetriever
from graph_store import GraphStore
from graph_extractor import GraphExtractor


class DocumentRAGSystem:

    def __init__(self, config: RAGConfig):
        self.config = config
        self.embeddings = None
        self.llm = None
        self.vectorstore = None
        self.qa_chain = None
        self.retriever = None
        self.graph_store = None
        self.graph_extractor = None

        try:
            self.logger = SupabaseLogger(config)
        except Exception as e:
            print(f"Warning: SupabaseLogger failed ({e}). Using in-memory logger.")
            self.logger = _InMemoryLogger()

        self.document_processor = DocumentProcessor(config)
        self._initialize_components()

    def _initialize_components(self):
        print("Initializing RAG System (Supabase + pgvector)...")
        openai_api_key = os.getenv("OPENAI_API_KEY", "")
        github_token = os.getenv("GITHUB_TOKEN", "")

        # ── Embeddings (Multilingual MiniLM or OpenAI API fallback for Render) ───
        use_api_embeddings = os.getenv("USE_API_EMBEDDINGS", "true").lower() == "true"
        
        if use_api_embeddings and (openai_api_key or self.config.AZURE_API_KEY or github_token):
            try:
                from langchain_openai import OpenAIEmbeddings
                if self.config.AZURE_API_KEY:
                    from langchain_openai import AzureOpenAIEmbeddings
                    self.embeddings = AzureOpenAIEmbeddings(
                        azure_endpoint=self.config.AZURE_ENDPOINT,
                        api_key=self.config.AZURE_API_KEY,
                        api_version=self.config.AZURE_API_VERSION,
                        azure_deployment=self.config.EMBEDDING_DEPLOYMENT or "text-embedding-3-small",
                    )
                    print("[OK] Serverless Azure embeddings initialized (dimensions=384, ZERO-RAM mode)")
                elif github_token and not openai_api_key:
                    self.embeddings = OpenAIEmbeddings(
                        model="text-embedding-3-small",
                        dimensions=384,
                        api_key=github_token,
                        base_url="https://models.inference.ai.azure.com"
                    )
                    print("[OK] Serverless GitHub Models embeddings initialized (dimensions=384, ZERO-RAM mode)")
                else:
                    self.embeddings = OpenAIEmbeddings(
                        model="text-embedding-3-small",
                        dimensions=384,  # Fits vector(384) perfectly!
                        api_key=openai_api_key
                    )
                    print("[OK] Serverless OpenAI embeddings initialized (dimensions=384, ZERO-RAM mode)")
            except Exception as e:
                print(f"[WARNING] Serverless embeddings initialization failed ({e}). Falling back to local MiniLM.")
                use_api_embeddings = False
                
        if not use_api_embeddings:
            try:
                from langchain_huggingface import HuggingFaceEmbeddings
                self.embeddings = HuggingFaceEmbeddings(
                    model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
                    model_kwargs={"device": "cpu"},
                    encode_kwargs={"normalize_embeddings": True},
                )
                print("[OK] Multilingual MiniLM embeddings initialized (fast mode)")
            except Exception as e:
                print(f"[WARNING] MiniLM failed ({e}), falling back to mock embeddings")
                from langchain_core.embeddings import Embeddings
                class MockEmbeddings(Embeddings):
                    def embed_documents(self, texts: List[str]) -> List[List[float]]:
                        return [[0.0] * 384 for _ in texts]
                    def embed_query(self, text: str) -> List[float]:
                        return [0.0] * 384
                self.embeddings = MockEmbeddings()

        # ── LLM ─────────────────────────────────────────────────────────────────
        github_token = os.getenv("GITHUB_TOKEN", "")
        if self.config.AZURE_API_KEY:
            self.llm = AzureChatOpenAI(
                azure_endpoint=self.config.AZURE_ENDPOINT,
                api_key=self.config.AZURE_API_KEY,
                api_version=self.config.AZURE_API_VERSION,
                azure_deployment=self.config.DEPLOYMENT_NAME,
                temperature=self.config.TEMPERATURE,
                max_tokens=self.config.MAX_TOKENS,
            )
            print("[OK] Azure OpenAI LLM initialized")
        elif github_token:
            from langchain_openai import ChatOpenAI
            self.llm = ChatOpenAI(
                api_key=github_token,
                base_url="https://models.inference.ai.azure.com",
                model="gpt-4o",
                temperature=self.config.TEMPERATURE,
                max_tokens=self.config.MAX_TOKENS,
            )
            print("[OK] GitHub Models LLM initialized")
        elif openai_api_key:
            from langchain_openai import ChatOpenAI
            self.llm = ChatOpenAI(
                api_key=openai_api_key,
                model="gpt-4o",
                temperature=self.config.TEMPERATURE,
                max_tokens=self.config.MAX_TOKENS,
            )
            print("[OK] OpenAI LLM initialized")
        else:
            self.llm = _MockChatModel()
            print("[WARNING] Using Mock Offline LLM (no API keys)")

        # ── Vector Store (pgvector via Supabase REST API) ───────────────────────────
        try:
            self.vectorstore = PGVectorStore(
                supabase_url=self.config.SUPABASE_URL,
                service_key=self.config.SUPABASE_SERVICE_KEY,
                embeddings=self.embeddings,
                table_name=self.config.PGVECTOR_TABLE,
            )
            print("[OK] pgvector store initialized (Supabase REST API)")
        except Exception as e:
            print(f"[ERROR] pgvector initialization failed: {e}")
            raise


        self.retriever = self.vectorstore.as_retriever(
            search_kwargs={"k": self.config.RETRIEVER_K}
        )

        # ── BM25 (kept for hybrid retrieval) ─────────────────────────────────────
        self.bm25 = None
        if self.config.BM25_ENABLED:
            try:
                self.bm25 = BM25Retriever(self.config)
                print("[OK] BM25 retriever initialized")
            except Exception as e:
                print(f"Warning: BM25 disabled ({e})")

        # ── Knowledge Graph (Supabase PostgreSQL) ─────────────────────────────────
        if self.config.GRAPH_ENABLED:
            try:
                self.graph_store = GraphStore(self.config)
                self.graph_extractor = GraphExtractor(self.llm, self.config)
                print("[OK] Knowledge Graph initialized (Supabase PostgreSQL)")
            except Exception as e:
                print(f"Warning: Knowledge Graph disabled ({e})")
                self.graph_store = None
                self.graph_extractor = None

        # ── Hybrid Retriever (vector + BM25 + graph) ──────────────────────────────
        self.hybrid_retriever = HybridRetriever(
            vector_retriever=self.retriever,
            bm25_retriever=self.bm25,
            graph_retriever=self.graph_store,
            graph_extractor=self.graph_extractor,
            config=self.config,
        )
        retriever_parts = ["vector"]
        if self.bm25: retriever_parts.append("BM25")
        if self.graph_store: retriever_parts.append("graph")
        print(f"[OK] Hybrid retriever initialized ({' + '.join(retriever_parts)})")

        # ── QA Chain ─────────────────────────────────────────────────────────────
        prompt_template = """You are a helpful and knowledgeable assistant that answers questions based on the provided documents. Your role is to extract and present information from the context documents accurately and clearly.

IMPORTANT INSTRUCTIONS:
1. Answer questions using ONLY the information provided in the context below.
2. If the question is a greeting (like "hi", "hello"), greet back and offer to help answer questions about the documents.
3. For questions about people, places, skills, experiences, or information mentioned in the documents, extract and summarize the relevant details from the context.
4. If the context doesn't contain enough information to fully answer the question, say what information IS available and mention what's missing.
5. Be conversational, helpful, and provide specific details from the documents when available.
6. Don't make up information that isn't in the context.
7. IMPORTANT: ALWAYS respond in {language}.
8. DO NOT use any markdown formatting, asterisks (like ** or *), or bold text. Keep all text plain and natural-looking.

Context from documents:
{context}

User Question: {question}

Answer (in {language}, based on the context above):"""

        PROMPT = PromptTemplate(template=prompt_template, input_variables=["context", "question", "language"])
        self.qa_prompt = PROMPT

        def format_docs(docs):
            return "\n\n".join(doc.page_content for doc in docs)

        self.qa_chain = (
            {"context": self.hybrid_retriever | format_docs, "question": RunnablePassthrough()}
            | PROMPT
            | self.llm
            | StrOutputParser()
        )

        print("[OK] QA chain initialized")
        print("=" * 50)

    # ── Public API ───────────────────────────────────────────────────────────────

    def add_file(self, file_path: str, metadata: Optional[Dict] = None):
        doc_name = os.path.basename(file_path)
        doc_type = os.path.splitext(file_path)[1][1:].upper()
        file_size = os.path.getsize(file_path)
        
        chunks = self.document_processor.process_file(file_path, metadata)
        if not chunks:
            print(f"Warning: No text extracted from {doc_name}")
            return

        self.vectorstore.add_documents(chunks)
        print(f"[OK] Added {len(chunks)} chunks from {doc_name} to pgvector")

        if self.bm25:
            self.bm25.add_documents(chunks)

        # Extract entities and relations into the Knowledge Graph
        if self.graph_store and self.graph_extractor:
            try:
                self.graph_extractor.extract_and_store(chunks, self.graph_store)
                print(f"[OK] Extracted entities from {doc_name} into Knowledge Graph")
            except Exception as e:
                print(f"Warning: Graph extraction failed for {doc_name}: {e}")

        self.logger.log_document(doc_name, doc_type, len(chunks), file_size, file_path)

    def add_documents(self, documents: List[str], metadata: Optional[List[Dict]] = None):
        all_chunks = self.document_processor.process_documents(documents, metadata)
        self.vectorstore.add_documents(all_chunks)
        print(f"[OK] Added {len(all_chunks)} chunks to pgvector")
        if self.bm25:
            self.bm25.add_documents(all_chunks)

        # Extract entities and relations into the Knowledge Graph
        if self.graph_store and self.graph_extractor:
            try:
                self.graph_extractor.extract_and_store(all_chunks, self.graph_store)
                print(f"[OK] Extracted entities from documents into Knowledge Graph")
            except Exception as e:
                print(f"Warning: Graph extraction failed: {e}")

    def query(self, question: str, user_id: Optional[str] = None, session_id: Optional[str] = None, language: str = "English") -> Dict[str, Any]:
        start_time = time.time()

        source_documents = self.hybrid_retriever.invoke(question, user_id=user_id)

        if not source_documents:
            execution_time = time.time() - start_time
            return {
                "answer": "I couldn't find relevant information in the uploaded documents to answer your question. Please make sure the documents contain the information you're looking for, or try rephrasing your question.",
                "sources": [],
                "num_sources": 0,
                "execution_time": execution_time,
            }

        # Format context from the source_documents we already retrieved using the correct user_id
        def format_docs(docs):
            return "\n\n".join(doc.page_content for doc in docs)
            
        context = format_docs(source_documents)

        # Generate answer using the correctly filtered context
        llm_chain = self.qa_prompt | self.llm | StrOutputParser()
        answer = llm_chain.invoke({"context": context, "question": question, "language": language})

        # Strip markdown stars (asterisks) to make the text look clean and natural
        if answer:
            answer = answer.replace("**", "").replace("*", "")
            
        execution_time = time.time() - start_time

        sources = [
            {
                "content": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                "metadata": doc.metadata,
            }
            for doc in source_documents
        ]

        context_texts = [doc.page_content for doc in source_documents]
        self.logger.log_query(question, answer, context_texts, execution_time, len(source_documents), session_id, user_id=user_id)

        return {
            "answer": answer,
            "sources": sources,
            "num_sources": len(sources),
            "execution_time": execution_time,
        }

    def get_history(self, limit: int = 5, user_id: Optional[str] = None, session_id: Optional[str] = None) -> List[Dict]:
        return self.logger.get_recent_queries(limit, user_id=user_id, session_id=session_id)

    def get_conversation_history(self, session_id: str, limit: int = 20) -> List[Dict]:
        return self.logger.get_conversation_history(session_id, limit)

    def delete_session(self, session_id: str, user_id: str) -> None:
        self.logger.delete_session(session_id, user_id)

    def get_documents(self) -> List[Dict]:
        return self.logger.get_all_documents()

    def close(self):
        self.logger.close()


# ── Fallback in-memory logger ────────────────────────────────────────────────

class _InMemoryLogger:
    def __init__(self):
        self.queries = []
        self.documents = []

    def log_query(self, query_text, answer, context_texts, execution_time, num_sources, session_id=None, user_id=None):
        self.queries.append({
            "query_text": query_text,
            "answer": answer,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "execution_time": execution_time,
            "num_sources": num_sources,
            "session_id": session_id,
            "user_id": user_id,
        })

    def log_document(self, name, doc_type, chunks_count, file_size, file_path):
        self.documents.append({"document_name": name, "num_chunks": chunks_count})

    def get_recent_queries(self, limit=10, user_id=None, session_id=None):
        filtered = [
            q for q in self.queries 
            if (session_id is None or q.get("session_id") == session_id)
            and (user_id is None or q.get("user_id") == user_id)
        ]
        return filtered[-limit:]

    def get_conversation_history(self, session_id, limit=20, user_id=None):
        return self.get_recent_queries(limit, user_id=user_id, session_id=session_id)

    def get_all_documents(self):
        return self.documents

    def close(self):
        pass


# ── Fallback mock LLM ────────────────────────────────────────────────────────

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage
from langchain_core.outputs import ChatResult, ChatGeneration


class _MockChatModel(BaseChatModel):
    def _generate(self, messages, stop=None, run_manager=None, **kwargs):
        prompt_text = messages[-1].content if messages else ""
        context = ""
        if "Context from documents:" in prompt_text:
            try:
                context = prompt_text.split("Context from documents:")[1].split("User Question:")[0].strip()
            except Exception:
                pass

        if context and "No relevant context found." not in context and context.strip():
            cleaned = context.replace("\n", " ").strip()
            if len(cleaned) > 250:
                cleaned = cleaned[:250] + "..."
            answer = f"Based on the documents: {cleaned}"
        else:
            answer = (
                "PolicyBot is running in offline mode (no API key configured). "
                "Please set OPENAI_API_KEY or AZURE_API_KEY in your .env file."
            )
        return ChatResult(generations=[ChatGeneration(message=AIMessage(content=answer))])

    @property
    def _llm_type(self) -> str:
        return "mock_chat_model"
