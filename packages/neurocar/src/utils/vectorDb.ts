// src/utils/vectorDb.ts
import { createClient } from '@supabase/supabase-js';
// import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Google Generative AI embeddings
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY || '',
  modelName: "embedding-001", // Use Google's embedding model
});

// Create vector store
const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabase,
  tableName: 'car_repair_knowledge',
  queryName: 'match_car_repair_knowledge',
});

export async function searchRepairKnowledge(query: string, carMake: string, carModel: string, carYear: string) {
  // Enhance query with car details for better matching
  const enhancedQuery = `${carMake} ${carModel} ${carYear} ${query}`;
  
  try {
    // Search for relevant documents
    const results = await vectorStore.similaritySearch(enhancedQuery, 5);
    return results;
  } catch (error) {
    console.error('Error searching repair knowledge:', error);
    return [];
  }
}