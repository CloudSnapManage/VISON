
import { GoogleGenAI, Type } from "@google/genai";
import { Category, NewsBriefing } from "../types";

export const fetchNewsBriefing = async (category: Category): Promise<NewsBriefing> => {
  // Cast to any to handle CI environments where process.env types might not be fully populated
  const apiKey = (process.env as any).API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-3-flash-preview';
  
  const prompt = `Find the absolute latest, most significant news item in the category of ${category}. 
  Provide a clean, professional intelligence briefing and a verification quiz.
  
  REQUIREMENTS:
  1. headline: Punchy and informative.
  2. summary: 2-sentence overview.
  3. takeaways: 3 essential points.
  4. interestingFact: A surprising 'did you know'.
  5. verificationQuiz: Create one multiple choice question about this news to test understanding.
  
  Focus on high-accuracy recent events.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
          interestingFact: { type: Type.STRING },
          quiz: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswerIndex", "explanation"]
          }
        },
        required: ["title", "summary", "keyTakeaways", "interestingFact", "quiz"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Aether connection failed.");
  
  const rawData = JSON.parse(text);
  const sourceUrls: string[] = [];
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
    question: rawData.quiz.question,
    options: rawData.quiz.options,
    correctAnswer: rawData.quiz.correctAnswerIndex,
    explanation: rawData.quiz.explanation,
  };
};
