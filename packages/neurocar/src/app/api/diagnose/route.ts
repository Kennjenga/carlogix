// src/app/api/diagnose/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchRepairKnowledge } from '@/utils/vectorDb';

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { carDetails, userQuery, useRag } = await request.json();
    
    // Basic validation
    if (!carDetails || !userQuery) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Extract relevant information
    const { make, model, year, mileage, vin } = carDetails;
    
    // Initialize context with car information
    let context = `
      Car Information:
      Make: ${make}
      Model: ${model}
      Year: ${year}
      Mileage: ${mileage}
      VIN: ${vin}
      
      User Query: ${userQuery}
    `;
    
    // If RAG is enabled, retrieve relevant information
    let relevantSources = 0;
    
    if (useRag) {
      // Search knowledge base for relevant information
      const searchResults = await searchRepairKnowledge(
        userQuery,
        make,
        model,
        year.toString()
      );
      
      relevantSources = searchResults.length;
      
      if (relevantSources > 0) {
        context += "\n\nRelevant Repair Knowledge:";
        
        searchResults.forEach((doc, index) => {
          context += `\n${index + 1}. ${doc.pageContent}`;
        });
      }
    }
    
    // Add instructions for the diagnosis format
    const prompt = `
      ${context}
      
      Based on the information provided, generate a detailed diagnosis for the car issue. 
      
      Your response should be a JSON object with the following structure:
      {
        "diagnosis": "A detailed explanation of the issue",
        "likelyIssue": "A brief summary of the most likely issue",
        "severity": "low", "medium", or "high",
        "urgency": true/false (whether immediate attention is required),
        "nextSteps": ["Step 1", "Step 2", ...],
        "estimatedCost": "Cost range or estimate"
      }
      
      Consider all relevant information and provide a comprehensive assessment. 
      If the issue is related to known problems with this car model, mention that.
    `;
    
    // Call Gemini API
    const generativeModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await generativeModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response from the AI
    let aiResponse;
    try {
      // Extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                         text.match(/```\s*([\s\S]*?)\s*```/) ||
                         [null, text];
      
      const jsonString = jsonMatch[1] || text;
      aiResponse = JSON.parse(jsonString);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.log('Raw response:', text);
      return NextResponse.json(
        { error: 'Failed to parse diagnosis' },
        { status: 500 }
      );
    }
    
    // Add the number of relevant sources if RAG was used
    if (useRag && relevantSources > 0) {
      aiResponse.relevantSources = relevantSources;
    }
    
    return NextResponse.json(aiResponse);
  } catch (error) {
    console.error('Error in diagnose API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}