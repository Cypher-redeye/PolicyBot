# PolicyBot

A RAG-based policy assistant with a FastAPI backend and React frontend.

## Project Structure

```
PolicyBot/
├── backend/
│   ├── main.py                  # entry point, starts the FastAPI server
│   ├── requirements.txt
│   ├── uploads/                 # uploaded policy documents
│   ├── app/
│   │   ├── app.py               # FastAPI app instance, CORS, registers routers
│   │   ├── database.py          # SQLAlchemy engine + session (PostgreSQL)
│   │   ├── routers/
│   │   │   ├── auth.py          # register, login endpoints
│   │   │   ├── documents.py     # upload, list, delete policy documents
│   │   │   └── query.py         # RAG query endpoint
│   │   ├── models/
│   │   │   ├── user.py          # User table
│   │   │   └── document.py      # Document table
│   │   ├── schemas/
│   │   │   ├── user.py          # Pydantic schemas for auth
│   │   │   └── document.py      # Pydantic schemas for documents
│   │   ├── services/
│   │   │   ├── auth_service.py      # register, login logic
│   │   │   └── document_service.py  # file storage + RAG ingestion
│   │   ├── rag/
│   │   │   └── pipeline.py      # bridge to graph-rag-hybrid system
│   │   └── core/
│   │       ├── config.py        # all settings via pydantic-settings
│   │       ├── security.py      # JWT, password hashing
│   │       └── dependencies.py  # get_db, get_current_user
│   └── graph-rag-hybrid/        # RAG engine
│       ├── rag_system.py        # orchestrator wiring all retrievers
│       ├── document_processor.py # chunking + chunk_id assignment
│       ├── hybrid_retriever.py  # parallel fan-out + RRF fusion
│       ├── bm25_retriever.py    # BM25 sparse retriever
│       ├── graph_store.py       # Neo4j connection + Cypher queries
│       ├── graph_extractor.py   # LLM-based entity/relation extraction
│       ├── logger.py            # MySQL session/query logging
│       ├── config.py            # RAG-specific settings
│       └── tests/               # unit + integration tests
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Home.jsx
        │   ├── Login.jsx
        │   └── Dashboard.jsx
        ├── components/
        │   ├── Chat/
        │   ├── Documents/
        │   └── Auth/
        ├── context/
        │   └── AuthContext.jsx
        ├── services/
        │   └── api.js
        ├── App.jsx
        └── main.jsx
```

## Tech Stack

- **Backend** — FastAPI, SQLAlchemy, PostgreSQL
- **RAG** — LangChain, ChromaDB, Neo4j, BM25, Azure OpenAI (gpt-4o)
- **Frontend** — React (Vite)
- **Auth** — JWT
