-- ============================================================
-- PolicyBot — BGE-M3 Migration (1024 dimensions)
-- Run this in Supabase SQL Editor (Database → SQL Editor)
-- ============================================================

-- 1. Create new document chunks table with 1024-dim vectors (BGE-M3)
create table if not exists document_chunks_bge (
    id          uuid primary key default gen_random_uuid(),
    content     text not null,
    metadata    jsonb default '{}',
    embedding   vector(1024)
);

-- 2. Vector similarity index (cosine distance)
create index if not exists document_chunks_bge_embedding_idx
    on document_chunks_bge using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);

-- 3. Match chunks function for BGE-M3 vector similarity search
create or replace function match_document_chunks_bge(
    query_embedding vector(1024),
    match_count     int default 10
)
returns table (
    id          uuid,
    content     text,
    metadata    jsonb,
    similarity  float
)
language sql stable
as $$
    select
        id,
        content,
        metadata,
        1 - (embedding <=> query_embedding) as similarity
    from document_chunks_bge
    order by embedding <=> query_embedding
    limit match_count;
$$;
