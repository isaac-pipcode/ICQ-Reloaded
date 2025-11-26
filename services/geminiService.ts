import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Message } from "../types";

// We keep a simple in-memory store of chats for the bot sessions
const activeChats: Record<string, Chat> = {};

let aiClient: GoogleGenAI | null = null;

const getAiClient = () => {
  if (aiClient) return aiClient;

  // Vite automatically replaces process.env.API_KEY with the value from GEMINI_API_KEY in the .env file at build time.
  // The mapping is defined in vite.config.ts
  const apiKey = process.env.API_KEY;

  // Return null if key is missing or is the placeholder
  if (!apiKey || apiKey.includes('Cole_Sua_API_Key')) {
    console.warn("GEMINI_API_KEY not configured in .env file or is still the placeholder.");
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
      return "Error: SYSTEM ERROR. GEMINI_API_KEY not configured in .env file.\n\nSTEPS TO FIX:\n1. Open the .env file in the project root\n2. Replace 'Cole_Sua_API_Key_Aqui' with your actual Gemini API key\n3. Get your API key from: https://aistudio.google.com/app/apikey\n4. STOP the server (Ctrl+C) and run 'npm run dev' again";
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
          temperature: 0.8, // Creative enough for a persona
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