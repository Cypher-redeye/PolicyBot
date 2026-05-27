-- ============================================================================
-- Graph-RAG Migration: Knowledge Graph tables for Supabase/PostgreSQL
-- Run this in the Supabase SQL Editor to enable Graph-RAG.
-- ============================================================================

-- 1. Entities table: stores unique extracted nodes (e.g. "IT Department", "Remote Work Policy")
CREATE TABLE IF NOT EXISTS graph_entities (
    id          BIGSERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    name_lower  TEXT NOT NULL,
    entity_type TEXT NOT NULL DEFAULT 'Concept',
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(name_lower)
);

CREATE INDEX IF NOT EXISTS idx_graph_entities_name_lower ON graph_entities (name_lower);
CREATE INDEX IF NOT EXISTS idx_graph_entities_type ON graph_entities (entity_type);

-- 2. Entity mentions: links entities to the document chunks they came from
CREATE TABLE IF NOT EXISTS graph_entity_mentions (
    id          BIGSERIAL PRIMARY KEY,
    entity_id   BIGINT NOT NULL REFERENCES graph_entities(id) ON DELETE CASCADE,
    chunk_id    TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(entity_id, chunk_id)
);

CREATE INDEX IF NOT EXISTS idx_gem_entity_id ON graph_entity_mentions (entity_id);
CREATE INDEX IF NOT EXISTS idx_gem_chunk_id  ON graph_entity_mentions (chunk_id);

-- 3. Relations table: directed edges between entities (e.g. "REQUIRES_APPROVAL_FROM")
CREATE TABLE IF NOT EXISTS graph_relations (
    id          BIGSERIAL PRIMARY KEY,
    source_id   BIGINT NOT NULL REFERENCES graph_entities(id) ON DELETE CASCADE,
    target_id   BIGINT NOT NULL REFERENCES graph_entities(id) ON DELETE CASCADE,
    rel_type    TEXT NOT NULL DEFAULT 'RELATES_TO',
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(source_id, target_id, rel_type)
);

CREATE INDEX IF NOT EXISTS idx_gr_source ON graph_relations (source_id);
CREATE INDEX IF NOT EXISTS idx_gr_target ON graph_relations (target_id);

-- 4. RPC function: search_graph
--    Given a list of entity name keywords, find related document chunks
--    via 1-hop or 2-hop traversal through the knowledge graph.
CREATE OR REPLACE FUNCTION search_graph(
    entity_names TEXT[],
    match_count  INT DEFAULT 10,
    hops         INT DEFAULT 1
)
RETURNS TABLE (
    chunk_id    TEXT,
    relevance   BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF hops <= 1 THEN
        -- 1-hop: entity mentioned in chunk directly
        RETURN QUERY
        SELECT
            gem.chunk_id,
            COUNT(*)::BIGINT AS relevance
        FROM graph_entities ge
        JOIN graph_entity_mentions gem ON gem.entity_id = ge.id
        WHERE ge.name_lower = ANY(entity_names)
           OR EXISTS (
               SELECT 1 FROM unnest(entity_names) AS en
               WHERE ge.name_lower LIKE '%' || en || '%'
           )
        GROUP BY gem.chunk_id
        ORDER BY relevance DESC
        LIMIT match_count;
    ELSE
        -- 2-hop: entity -> relation -> neighbor entity -> chunk
        RETURN QUERY
        SELECT
            gem.chunk_id,
            COUNT(DISTINCT neighbor.id)::BIGINT AS relevance
        FROM graph_entities ge
        -- Find relations where our entity is source or target
        JOIN graph_relations gr ON gr.source_id = ge.id OR gr.target_id = ge.id
        -- Get the neighbor entity on the other side
        JOIN graph_entities neighbor ON (
            (neighbor.id = gr.target_id AND gr.source_id = ge.id)
            OR (neighbor.id = gr.source_id AND gr.target_id = ge.id)
        )
        -- Find chunks the neighbor is mentioned in
        JOIN graph_entity_mentions gem ON gem.entity_id = neighbor.id
        WHERE ge.name_lower = ANY(entity_names)
           OR EXISTS (
               SELECT 1 FROM unnest(entity_names) AS en
               WHERE ge.name_lower LIKE '%' || en || '%'
           )
        GROUP BY gem.chunk_id
        ORDER BY relevance DESC
        LIMIT match_count;
    END IF;
END;
$$;
