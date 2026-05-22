-- ============================================================
-- PolicyBot — Supabase Schema Setup
-- Run this once in Supabase SQL Editor (Database → SQL Editor)
-- ============================================================

-- 1. Enable pgvector extension (should already be enabled)
create extension if not exists vector;

-- 2. Users table (custom auth — stores hashed passwords)
create table if not exists users (
    id          uuid primary key default gen_random_uuid(),
    email       text unique not null,
    hashed_password text not null,
    is_active   boolean default true,
    is_superuser boolean default false,
    created_at  timestamptz default now()
);

-- 3. Documents table
create table if not exists documents (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid references users(id) on delete cascade not null,
    filename     text not null,
    storage_path text not null,
    status       text default 'uploaded',
    created_at   timestamptz default now()
);
create index if not exists documents_user_id_idx on documents(user_id);

-- 4. Document chunks table (vector store — replaces ChromaDB)
create table if not exists document_chunks (
    id          uuid primary key default gen_random_uuid(),
    document_id uuid references documents(id) on delete cascade,
    content     text not null,
    metadata    jsonb default '{}',
    embedding   vector(1536)
);

-- Vector similarity index (cosine distance)
create index if not exists document_chunks_embedding_idx
    on document_chunks using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);

-- 5. Query logs table (replaces MySQL logger)
create table if not exists query_logs (
    id             uuid primary key default gen_random_uuid(),
    query_text     text not null,
    answer         text,
    session_id     text,
    num_sources    int default 0,
    execution_time float default 0,
    created_at     timestamptz default now()
);
create index if not exists query_logs_session_id_idx on query_logs(session_id);
create index if not exists query_logs_created_at_idx on query_logs(created_at desc);

-- 6. Match chunks function for vector similarity search
create or replace function match_document_chunks(
    query_embedding vector(1536),
    match_count     int default 10
)
returns table (
    id          uuid,
    document_id uuid,
    content     text,
    metadata    jsonb,
    similarity  float
)
language sql stable
as $$
    select
        id,
        document_id,
        content,
        metadata,
        1 - (embedding <=> query_embedding) as similarity
    from document_chunks
    order by embedding <=> query_embedding
    limit match_count;
$$;
