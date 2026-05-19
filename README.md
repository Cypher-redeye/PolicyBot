# PolicyBot

A RAG-based policy assistant with a FastAPI backend and React frontend.

## Project Structure

```
policybot/
├── backend/
│   ├── main.py                  # entry point, starts the FastAPI server
│   ├── requirements.txt
│   └── app/
│       ├── app.py               # FastAPI app instance, registers routers
│       ├── database.py          # SQLAlchemy engine, session setup (PostgreSQL)
│       ├── routers/
│       │   ├── auth.py          # login, register, token endpoints
│       │   ├── documents.py     # upload, list, delete policy documents
│       │   └── query.py         # RAG query endpoint
│       ├── models/
│       │   ├── user.py          # SQLAlchemy User table
│       │   └── document.py      # SQLAlchemy Document table
│       ├── schemas/
│       │   ├── user.py          # Pydantic schemas for user request/response
│       │   └── document.py      # Pydantic schemas for document request/response
│       ├── services/
│       │   ├── auth_service.py      # user creation, login logic
│       │   └── document_service.py  # document processing and storage logic
│       ├── rag/
│       │   ├── pipeline.py      # orchestrates retrieval + LLM generation
│       │   ├── embeddings.py    # generates embeddings for documents
│       │   └── retriever.py     # queries vector DB for relevant chunks
│       └── core/
│           ├── config.py        # app settings via pydantic-settings
│           ├── security.py      # JWT creation, password hashing
│           └── dependencies.py  # shared FastAPI Depends() (e.g. get_db, get_current_user)
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Home.jsx         # landing page
        │   ├── Login.jsx        # login/register page
        │   └── Dashboard.jsx    # main chat + document management UI
        ├── components/
        │   ├── Chat/            # chat interface components
        │   ├── Documents/       # document upload and list components
        │   └── Auth/            # login/register form components
        ├── context/
        │   └── AuthContext.jsx  # global auth state (user, token)
        ├── services/
        │   └── api.js           # axios instance, all API call functions
        ├── App.jsx              # routes setup
        └── main.jsx             # React entry point
```

## Tech Stack

- **Backend** — FastAPI, SQLAlchemy, PostgreSQL
- **RAG** — LangChain / LlamaIndex, vector DB, LLM
- **Frontend** — React (Vite)
- **Auth** — JWT
