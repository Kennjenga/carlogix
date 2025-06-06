// scripts/populate-repair-knowledge.mjs
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { Document } from "@langchain/core/documents";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Setup proper paths for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing Supabase credentials. Check your environment variables."
  );
  console.log(
    "NEXT_PUBLIC_SUPABASE_URL:",
    process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set"
  );
  console.log(
    "SUPABASE_SERVICE_KEY:",
    process.env.SUPABASE_SERVICE_KEY ? "Set" : "Not set"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Google Generative AI embeddings
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Missing Gemini API key. Check your environment variables.");
  process.exit(1);
}

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey,
  modelName: "embedding-001",
});

async function populateVectorStore() {
  try {
    console.log("Reading repair knowledge data...");

    // Go up from scripts directory to find data directory
    const projectRoot = join(__dirname, "..");
    const dataPath = join(projectRoot, "data", "repair-knowledge.json");

    console.log("Looking for data file at:", dataPath);

    if (!existsSync(dataPath)) {
      console.error(`File not found: ${dataPath}`);
      process.exit(1);
    }

    // Read repair knowledge from JSON file
    const repairData = JSON.parse(readFileSync(dataPath, "utf-8"));

    console.log(`Found ${repairData.length} repair knowledge entries`);

    // Convert to LangChain documents
    const documents = repairData.map((entry) => {
      const content = `Make: ${entry.make}
Model: ${entry.model}
Year Range: ${entry.year_range}
System: ${entry.system}
Symptom: ${entry.symptom}
Diagnosis: ${entry.diagnosis}
Solution: ${entry.solution}
Severity: ${entry.severity}
Requires Immediate Attention: ${
        entry.requires_immediate_attention ? "Yes" : "No"
      }
Estimated Cost Range: ${entry.cost_range || "Unknown"}`;

      return new Document({
        pageContent: content,
        metadata: {
          id: entry.id,
          make: entry.make.toLowerCase(),
          model: entry.model.toLowerCase(),
          year_range: entry.year_range,
          system: entry.system,
        },
      });
    });

    console.log("Creating vector embeddings and storing in Supabase...");

    // Store documents in Supabase with explicit configuration
    await SupabaseVectorStore.fromDocuments(documents, embeddings, {
      client: supabase,
      tableName: "car_repair_knowledge",
      queryName: "match_car_repair_knowledge",
    });

    console.log(
      `Successfully added ${documents.length} documents to vector store`
    );
  } catch (error) {
    console.error("Error populating vector store:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Stack trace:", error.stack);
    }
  }
}

// Execute the function
populateVectorStore()
  .then(() => console.log("Finished populating vector store"))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
