// src/utils/vectorDb.ts
import { createClient } from '@supabase/supabase-js';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
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

// Create vector store (lazily initialized to prevent issues during build time)
const getVectorStore = async () => {
  const supabase = getSupabaseClient();
  const embeddings = getEmbeddings();
  
  return new SupabaseVectorStore(embeddings, {
    client: supabase,
    tableName: 'car_repair_knowledge',
    queryName: 'match_car_repair_knowledge',
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
    
    // Get vector store and search
    const vectorStore = await getVectorStore();
    
    // Search with metadata filter option if needed
    const results = await vectorStore.similaritySearch(enhancedQuery, 5, {
      make: normalizedMake,
      model: normalizedModel,
    });
    
    console.log(`Found ${results.length} relevant repair knowledge entries`);
    return results;
  } catch (error) {
    console.error('Error searching repair knowledge:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return [];
  }
}