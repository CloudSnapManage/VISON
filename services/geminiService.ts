
import { GoogleGenAI, Type } from "@google/genai";
import { Category, NewsBriefing } from "../types";

export const fetchNewsBriefing = async (category: Category): Promise<NewsBriefing> => {
  // Always create a new GoogleGenAI instance right before the call to ensure the latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-3-flash-preview';
  
  const prompt = `Find the absolute latest, most significant news item in the category of ${category}. 
  Provide a clean, professional intelligence briefing.
  Include a punchy headline, a high-level summary, 3 essential key takeaways, and one surprising 'did you know' fact.
  Focus on facts and clarity.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Professional news headline" },
          summary: { type: Type.STRING, description: "A concise 2-sentence summary of the event" },
          keyTakeaways: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Exactly 3 critical points to understand the news"
          },
          interestingFact: { type: Type.STRING, description: "A surprising or educational 'Did you know?' related to this news" }
        },
        required: ["title", "summary", "keyTakeaways", "interestingFact"]
      }
    }
  });

  // Access the .text property directly (do not call as a method)
  const text = response.text;
  if (!text) {
    throw new Error("Aether connection failed: No intelligence data retrieved.");
  }
  
  const rawData = JSON.parse(text);
  
  const sourceUrls: string[] = [];
  // Extract URLs from search grounding results
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks) {
    groundingChunks.forEach((chunk: any) => {
      if (chunk.web?.uri) sourceUrls.push(chunk.web.uri);
    });
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    category,
    title: rawData.title,
    summary: rawData.summary,
    keyTakeaways: rawData.keyTakeaways,
    interestingFact: rawData.interestingFact,
    sourceUrls: sourceUrls.length > 0 ? sourceUrls : ["https://news.google.com"],
  };
};
