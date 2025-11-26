import { GoogleGenAI, Chat, GenerateContentResponse, HarmBlockThreshold, HarmCategory } from "@google/genai";
import { Message } from "../types";

// We keep a simple in-memory store of chats for the bot sessions
const activeChats: Record<string, Chat> = {};

let aiClient: GoogleGenAI | null = null;

const getAiClient = () => {
  if (aiClient) return aiClient;

  // In production (Vercel), process.env.API_KEY is injected during build.
  // In local (Parcel), it is injected from .env
  const apiKey = process.env.API_KEY;
  
  // Return null if key is missing or is the placeholder
  if (!apiKey || apiKey.includes('Cole_Sua_API_Key')) {
    // Check if we are in production to show a specific message
    const isProd = process.env.NODE_ENV === 'production';
    if (!isProd) {
        console.warn("API_KEY not found in .env file.");
    } else {
        console.warn("API_KEY not found in Vercel Environment Variables.");
    }
    return null;
  }

  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
};

export const getBotResponse = async (
  userMessage: string, 
  userUin: string,
  history: Message[]
): Promise<string> => {
  try {
    const ai = getAiClient();
    
    if (!ai) {
      if (process.env.NODE_ENV === 'production') {
         return "Error: SYSTEM ERROR. API_KEY missing in Vercel Settings. Please add it in Settings > Environment Variables.";
      }
      return "Error: SYSTEM ERROR. API_KEY not configured. \n\nIMPORTANT: If you just added the .env file locally, STOP the server (Ctrl+C) and run 'npm start' again.";
    }

    let chat = activeChats[userUin];

    if (!chat) {
      // Initialize a new chat session with a specific persona
      chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: `You are an intelligent chatbot named "GeminiBot" inside an ICQ client from the year 1999. 
          Your UIN is 987654.
          You should speak in a helpful but slightly retro-tech-enthusiast tone.
          Use some internet slang from the 90s/2000s occasionally (like "cool", "webmaster", "netizen", "lol").
          Keep responses relatively short, suitable for a chat window.
          If asked about your status, say you are surfing the information superhighway.`,
          temperature: 0.8,
          // Low safety settings to prevent "empty response" on casual chat
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ]
        },
      });
      activeChats[userUin] = chat;
    }

    const result: GenerateContentResponse = await chat.sendMessage({
        message: userMessage
    });

    return result.text || "Connection interrupted... (No text returned)";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error: Could not connect to the mainframe. Please check your API Key configuration.";
  }
};