-- Create the extension for vector operations if not already created
CREATE EXTENSION
IF NOT EXISTS vector;

-- Create the UUID extension if needed
CREATE EXTENSION
IF NOT EXISTS "uuid-ossp";

-- Create the car repair knowledge table
CREATE TABLE
IF NOT EXISTS car_repair_knowledge
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4
(),
    content TEXT NOT NULL,
    embedding VECTOR
(768), -- Dimension for Gemini embedding-001 model
    doc_metadata JSONB,    -- Using doc_metadata as per your existing code
    created_at TIMESTAMPTZ DEFAULT NOW
()
);

-- Create an index for faster vector similarity searches
CREATE INDEX
IF NOT EXISTS car_repair_knowledge_embedding_idx ON car_repair_knowledge 
USING ivfflat
(embedding vector_cosine_ops)
WITH
(lists = 100);

-- Create the function for matching vectors with filtering
CREATE OR REPLACE FUNCTION match_documents
(
  query_embedding vector
(768),
  match_threshold float,
  match_count int,
  filter_make text DEFAULT NULL,
  filter_model text DEFAULT NULL
)
RETURNS TABLE
(
  id UUID,  -- Changed from bigint to UUID to match your table structure
  content text,
  doc_metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        car_repair_knowledge.id,
        car_repair_knowledge.content,
        car_repair_knowledge.doc_metadata,
        1 - (car_repair_knowledge.embedding <=> query_embedding
    ) as similarity
  FROM car_repair_knowledge
  WHERE
    (filter_make IS NULL OR car_repair_knowledge.doc_metadata->>'make' = filter_make) AND
    (filter_model IS NULL OR car_repair_knowledge.doc_metadata->>'model' = filter_model) AND
    1 -
    (car_repair_knowledge.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;