"use server";

import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export interface ProjectIdea {
  title: string;
  description: string;
  techStack: string[];
  testStrategy: string; // Added for professional depth
}

export async function generateIdeas(jobTitle: string): Promise<ProjectIdea[]> {
  if (!jobTitle) {
    throw new Error("Job title is required");
  }

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are an expert technical recruiter and senior software engineer.
Your task is to suggest exactly 3 realistic, impressive portfolio project ideas tailored for a candidate applying for the target job title.
The output MUST be a strict JSON object with a single root key called "projects".
The "projects" array must contain exactly 3 objects.
Each object must have the following keys:
- "title": A catchy, professional name for the project.
- "description": A concise, 1-2 sentence description of what the project does.
- "techStack": An array of strings (e.g., ["Next.js", "TypeScript", "Tailwind CSS"]).
- "testStrategy": A 1-sentence professional testing plan (e.g., "Implement E2E testing with Playwright to validate core user flows").`,
        },
        {
          role: "user",
          content: `Generate 3 project ideas for the following target job title: ${jobTitle}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content received from Groq API");
    }

    const parsed = JSON.parse(content);
    
    if (!parsed.projects || !Array.isArray(parsed.projects)) {
      throw new Error("Invalid response structure from Groq API");
    }

    return parsed.projects as ProjectIdea[];
  } catch (error) {
    console.error("Failed to generate ideas:", error);
    throw new Error("Failed to generate project ideas. Please try again.");
  }
}