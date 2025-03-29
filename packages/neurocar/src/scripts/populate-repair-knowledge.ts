// scripts/populate-repair-knowledge.ts
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { Document } from '@langchain/core/documents';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Google Generative AI embeddings
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY || '',
  modelName: "embedding-001", // Use Google's embedding model
});

async function populateVectorStore() {
  try {
    console.log('Reading repair knowledge data...');
    
    // Read repair knowledge from JSON file
    const repairData = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'data', 'repair-knowledge.json'), 'utf-8')
    );
    
    console.log(`Found ${repairData.length} repair knowledge entries`);
    
    // Convert to LangChain documents
    interface RepairEntry {
      id: string;
      make: string;
      model: string;
      year_range: string;
      system: string;
      symptom: string;
      diagnosis: string;
      solution: string;
      severity: string;
      requires_immediate_attention: boolean;
      cost_range?: string;
    }

    const documents = repairData.map((entry: RepairEntry) => {
      const content = `
        Make: ${entry.make}
        Model: ${entry.model}
        Year Range: ${entry.year_range}
        System: ${entry.system}
        Symptom: ${entry.symptom}
        Diagnosis: ${entry.diagnosis}
        Solution: ${entry.solution}
        Severity: ${entry.severity}
        Requires Immediate Attention: ${entry.requires_immediate_attention ? 'Yes' : 'No'}
        Estimated Cost Range: ${entry.cost_range || 'Unknown'}
      `;
      
      return new Document({
        pageContent: content,
        metadata: {
          id: entry.id,
          make: entry.make,
          model: entry.model,
          year_range: entry.year_range,
          system: entry.system,
        },
      });
    });
    
    console.log('Creating vector embeddings and storing in Supabase...');
    
    // Store documents in Supabase
    await SupabaseVectorStore.fromDocuments(documents, embeddings, {
      client: supabase,
      tableName: 'car_repair_knowledge',
      queryName: 'match_car_repair_knowledge',
    });
    
    console.log(`Successfully added ${documents.length} documents to vector store`);
  } catch (error) {
    console.error('Error populating vector store:', error);
  }
}

populateVectorStore();