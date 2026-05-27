-- ============================================================
-- PolicyBot — MiniLM Migration (384 dimensions)
-- Run this in Supabase SQL Editor (Database → SQL Editor)
-- ============================================================

-- 1. Create new document chunks table with 384-dim vectors (MiniLM)
create table if not exists document_chunks_ml (
    id          uuid primary key default gen_random_uuid(),
    document_id uuid references documents(id) on delete cascade,
    content     text not null,
    metadata    jsonb default '{}',
    embedding   vector(384)
);

-- 2. Vector similarity index (cosine distance)
create index if not exists document_chunks_ml_embedding_idx
    on document_chunks_ml using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);

-- 3. Match chunks function for MiniLM vector similarity search
create or replace function match_document_chunks_ml(
    query_embedding vector(384),
    match_count     int default 10,
    filter_user_id  text default null
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
    from document_chunks_ml
    where (filter_user_id is null or (metadata->>'user_id') = filter_user_id)
    order by embedding <=> query_embedding
    limit match_count;
$$;
