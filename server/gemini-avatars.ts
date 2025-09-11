import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY || "" });

export async function generateAvatar(prompt: string, fileName: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No image generated");
    }

    const content = candidates[0].content;
    if (!content || !content.parts) {
      throw new Error("No content parts found");
    }

    for (const part of content.parts) {
      if (part.inlineData && part.inlineData.data) {
        const imageData = Buffer.from(part.inlineData.data, "base64");
        const imagePath = path.join(process.cwd(), "public", "avatars", fileName);
        
        // Ensure avatars directory exists
        const avatarsDir = path.dirname(imagePath);
        if (!fs.existsSync(avatarsDir)) {
          fs.mkdirSync(avatarsDir, { recursive: true });
        }
        
        fs.writeFileSync(imagePath, imageData);
        return `/avatars/${fileName}`;
      }
    }
    
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Error generating avatar:", error);
    throw new Error(`Failed to generate avatar: ${error}`);
  }
}

export const AVATAR_PROMPTS = [
  {
    id: "friendly-human-1",
    name: "Friendly Face",
    prompt: "Create a professional, friendly, gender-neutral human face avatar for a financial app. The person should have a warm smile, professional appearance, and approachable demeanor. Close-up face only, clean vector style, soft colors.",
    type: "human"
  },
  {
    id: "professional-human-1",
    name: "Professional",
    prompt: "Create a professional business person avatar, gender-neutral, close-up face only. Clean, minimalist style with a confident but approachable expression. Suitable for a financial coaching app.",
    type: "human"
  },
  {
    id: "wise-owl",
    name: "Wise Owl",
    prompt: "Create a wise, friendly owl avatar with large intelligent eyes, close-up face only. Warm colors, cartoon style, expressing wisdom and trustworthiness. Perfect for a financial advisor mascot.",
    type: "animal"
  },
  {
    id: "clever-fox",
    name: "Clever Fox",
    prompt: "Create a smart, friendly fox avatar with bright eyes and a subtle smile, close-up face only. Orange and white colors, cartoon style, expressing intelligence and reliability.",
    type: "animal"
  },
  {
    id: "trustworthy-bear",
    name: "Trustworthy Bear",
    prompt: "Create a gentle, trustworthy bear avatar with kind eyes, close-up face only. Brown colors, friendly cartoon style, expressing reliability and warmth. Perfect for financial guidance.",
    type: "animal"
  },
  {
    id: "smart-elephant",
    name: "Smart Elephant",
    prompt: "Create a wise, gentle elephant avatar with intelligent eyes, close-up face only. Gray colors, friendly cartoon style, expressing wisdom and memory - perfect for financial planning.",
    type: "animal"
  }
];