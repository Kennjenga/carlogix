import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

// Initialize Supabase client with proper error handling for server-side
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials. Check your environment variables.');
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

// Initialize embeddings with error handling
const getEmbeddings = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Missing Gemini API key. Check your environment variables.');
  }
  
  return new GoogleGenerativeAIEmbeddings({
    apiKey,
    modelName: "embedding-001",
  });
};

export async function searchRepairKnowledge(query: string, carMake: string, carModel: string, carYear: string) {
  try {
    // Normalize inputs to improve matching
    const normalizedMake = carMake.toLowerCase().trim();
    const normalizedModel = carModel.toLowerCase().trim();
    const normalizedQuery = query.toLowerCase().trim();

    // Enhance query with car details for better matching
    const enhancedQuery = `${normalizedMake} ${normalizedModel} ${carYear} ${normalizedQuery}`;

    // Get necessary clients
    const supabase = getSupabaseClient();
    const embeddings = getEmbeddings();

    // Generate embedding for the query
    const queryEmbedding = await embeddings.embedQuery(enhancedQuery);

    // Perform similarity search directly with Supabase
    const { data: results, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,  // Adjust as needed
      match_count: 5,        // Return top 5 matches
      filter_make: normalizedMake,
      filter_model: normalizedModel
    });

    if (error) {
      console.error('Error searching documents:', error);
      return [];
    }

    // Transform results to match LangChain Document format
    interface Result {
      content: string;
      doc_metadata: { make: string; model: string; [key: string]: unknown };
      similarity: number;
    }

    const documents = results.map((result: Result) => ({
      pageContent: result.content,
      metadata: result.doc_metadata,
      score: result.similarity
    }));

    console.log(`Found ${documents.length} relevant repair knowledge entries`);
    return documents;
  } catch (error) {
    console.error('Error searching repair knowledge:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return [];
  }
} 

