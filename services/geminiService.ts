import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Message } from "../types";

// In a real production app, this key would be proxied through a backend.
// As per instructions, we use process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// We keep a simple in-memory store of chats for the bot sessions
const activeChats: Record<string, Chat> = {};

export const getBotResponse = async (
  userMessage: string, 
  userUin: string,
  history: Message[]
): Promise<string> => {
  try {
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
    return "Error: Could not connect to the mainframe. Please check your API Key.";
  }
};
