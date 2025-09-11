import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";
// Using global fetch available in Node.js 18+

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateAvatar(prompt: string, fileName: string): Promise<string> {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error("No image URL returned from OpenAI");
    }

    // Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error("Failed to download generated image");
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const imagePath = path.join(process.cwd(), "public", "avatars", fileName);
    
    // Ensure avatars directory exists
    const avatarsDir = path.dirname(imagePath);
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }
    
    fs.writeFileSync(imagePath, imageBuffer);
    return `/avatars/${fileName}`;
  } catch (error) {
    console.error("Error generating avatar with OpenAI:", error);
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
    id: "friendly-human-2", 
    name: "Professional Advisor",
    prompt: "Create a professional financial advisor avatar, gender-neutral, wearing business attire, with a confident yet friendly expression. Close-up face only, vector style, professional colors.",
    type: "human"
  },
  {
    id: "diverse-human-1",
    name: "Diverse Professional",
    prompt: "Create a diverse, professional avatar for a financial coaching app. Gender-neutral, warm and approachable expression, business casual attire. Close-up face only, modern illustration style.",
    type: "human"
  },
  {
    id: "friendly-mascot-1",
    name: "Money Buddy",
    prompt: "Create a friendly financial mascot character - a cute, approachable cartoon figure that represents savings and financial wisdom. Not human, but friendly and trustworthy. Simple, clean design with soft colors.",
    type: "mascot"
  },
  {
    id: "friendly-mascot-2",
    name: "Budget Bear",
    prompt: "Create a friendly bear character wearing a small business suit or holding a calculator, representing financial planning. Cute, approachable, cartoon style with warm colors.",
    type: "mascot"
  },
  {
    id: "abstract-1",
    name: "Financial Symbol",
    prompt: "Create an abstract, modern avatar representing financial growth and stability. Geometric shapes, upward arrows, or stylized dollar signs in a professional color scheme. Clean, minimalist design.",
    type: "abstract"
  }
];