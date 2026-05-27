"""
Knowledge Graph store using Supabase PostgREST REST API.
Replaces Neo4j — runs entirely on your existing Supabase/PostgreSQL instance.
"""
import json
import os
import httpx
from typing import List, Dict, Any, Optional

from langchain_core.documents import Document

from config import RAGConfig


class GraphStore:
    """
    Stores entities, relations, and chunk-entity mentions in Supabase
    PostgreSQL tables. Searches via a Postgres RPC function (search_graph).
    """

    def __init__(self, config: RAGConfig):
        self.config = config
        self.supabase_url = config.SUPABASE_URL
        self.service_key = config.SUPABASE_SERVICE_KEY
        if not self.supabase_url or not self.service_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY are required for GraphStore.")

    def _headers(self) -> dict:
        return {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def _rest_url(self, path: str) -> str:
        return f"{self.supabase_url}/rest/v1/{path}"

    def close(self) -> None:
        pass  # No persistent connection to close with REST API

    # ── Write Methods ────────────────────────────────────────────────────────

    def add_chunks(self, docs: List[Document]) -> None:
        """No-op: chunks are already stored in pgvector. This is kept for interface compat."""
        pass

    def _upsert_entity(self, name: str, entity_type: str) -> Optional[int]:
        """Insert or get an entity, returning its ID."""
        name_lower = name.lower().strip()
        if not name_lower:
            return None

        # Try to find existing entity first
        try:
            r = httpx.get(
                self._rest_url("graph_entities"),
                params={"name_lower": f"eq.{name_lower}", "select": "id"},
                headers=self._headers(),
                timeout=15,
            )
            r.raise_for_status()
            rows = r.json()
            if rows:
                return rows[0]["id"]
        except Exception:
            pass

        # Insert new entity
        try:
            r = httpx.post(
                self._rest_url("graph_entities"),
                json={"name": name.strip(), "name_lower": name_lower, "entity_type": entity_type},
                headers={**self._headers(), "Prefer": "return=representation"},
                timeout=15,
            )
            if r.status_code == 409:
                # Conflict = already exists, fetch it
                r2 = httpx.get(
                    self._rest_url("graph_entities"),
                    params={"name_lower": f"eq.{name_lower}", "select": "id"},
                    headers=self._headers(),
                    timeout=15,
                )
                r2.raise_for_status()
                rows = r2.json()
                return rows[0]["id"] if rows else None
            r.raise_for_status()
            rows = r.json()
            return rows[0]["id"] if rows else None
        except Exception as e:
            print(f"Warning: entity upsert failed for '{name}': {e}")
            return None

    def _add_mention(self, entity_id: int, chunk_id: str) -> None:
        """Link an entity to a chunk."""
        try:
            r = httpx.post(
                self._rest_url("graph_entity_mentions"),
                json={"entity_id": entity_id, "chunk_id": chunk_id},
                headers={**self._headers(), "Prefer": "return=minimal"},
                timeout=15,
            )
            # 409 = duplicate, that's fine
            if r.status_code != 409:
                r.raise_for_status()
        except Exception as e:
            print(f"Warning: mention insert failed: {e}")

    def _add_relation(self, source_id: int, target_id: int, rel_type: str) -> None:
        """Create a directed edge between two entities."""
        try:
            r = httpx.post(
                self._rest_url("graph_relations"),
                json={"source_id": source_id, "target_id": target_id, "rel_type": rel_type},
                headers={**self._headers(), "Prefer": "return=minimal"},
                timeout=15,
            )
            if r.status_code != 409:
                r.raise_for_status()
        except Exception as e:
            print(f"Warning: relation insert failed: {e}")

    def add_entities(self, triples: Dict[str, Any]) -> None:
        """
        Write extracted entities & relations from a single chunk.

        triples = {
            "chunk_id": str,
            "entities": [{"name": str, "type": str}, ...],
            "relations": [{"source": str, "target": str, "type": str}, ...],
        }
        """
        chunk_id = triples.get("chunk_id")
        entities = triples.get("entities") or []
        relations = triples.get("relations") or []
        if not chunk_id:
            return

        # Map entity name_lower -> entity_id for linking relations
        name_to_id: Dict[str, int] = {}

        for ent in entities:
            name = (ent.get("name") or "").strip()
            etype = (ent.get("type") or "Concept").strip()
            if not name:
                continue
            eid = self._upsert_entity(name, etype)
            if eid is not None:
                name_to_id[name.lower()] = eid
                self._add_mention(eid, chunk_id)

        for rel in relations:
            src = (rel.get("source") or "").strip()
            tgt = (rel.get("target") or "").strip()
            rtype = (rel.get("type") or "RELATES_TO").strip().upper().replace(" ", "_")
            if not src or not tgt:
                continue

            # Ensure both endpoints exist
            src_id = name_to_id.get(src.lower())
            if src_id is None:
                src_id = self._upsert_entity(src, "Concept")
                if src_id:
                    name_to_id[src.lower()] = src_id
            tgt_id = name_to_id.get(tgt.lower())
            if tgt_id is None:
                tgt_id = self._upsert_entity(tgt, "Concept")
                if tgt_id:
                    name_to_id[tgt.lower()] = tgt_id

            if src_id and tgt_id:
                self._add_relation(src_id, tgt_id, rtype)

    # ── Search Method ────────────────────────────────────────────────────────

    def search(self, entity_names: List[str], k: int = 10, hops: int = 1) -> List[Document]:
        """Find chunks related to the given entity names via the knowledge graph."""
        if not entity_names:
            return []

        names_lower = [n.lower().strip() for n in entity_names if n.strip()]
        if not names_lower:
            return []

        try:
            r = httpx.post(
                self._rest_url("rpc/search_graph"),
                json={
                    "entity_names": names_lower,
                    "match_count": k,
                    "hops": hops,
                },
                headers=self._headers(),
                timeout=30,
            )
            r.raise_for_status()
            graph_results = r.json()
        except Exception as e:
            print(f"Warning: graph search failed: {e}")
            return []

        if not graph_results:
            return []

        # Fetch the actual chunk content from pgvector table
        chunk_ids = [row["chunk_id"] for row in graph_results]
        relevance_map = {row["chunk_id"]: row["relevance"] for row in graph_results}

        try:
            # Fetch chunk content from the document_chunks table
            table = self.config.PGVECTOR_TABLE
            # Use PostgREST IN filter
            chunk_ids_param = ",".join(f'"{cid}"' for cid in chunk_ids)
            r = httpx.get(
                self._rest_url(table),
                params={
                    "select": "content,metadata",
                    "metadata->>chunk_id": f"in.({chunk_ids_param})",
                },
                headers=self._headers(),
                timeout=30,
            )
            r.raise_for_status()
            rows = r.json()
        except Exception as e:
            print(f"Warning: chunk fetch for graph results failed: {e}")
            return []

        docs: List[Document] = []
        for row in rows:
            meta = row.get("metadata", {})
            if isinstance(meta, str):
                meta = json.loads(meta)
            cid = meta.get("chunk_id", "")
            meta["graph_relevance"] = relevance_map.get(cid, 0)
            docs.append(Document(page_content=row.get("content", ""), metadata=meta))

        # Sort by graph relevance descending
        docs.sort(key=lambda d: d.metadata.get("graph_relevance", 0), reverse=True)
        return docs[:k]
