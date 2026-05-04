"use server";

import OpenAI from "openai";
import { getUserProfile } from "./db-actions";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export type ProjectGoal = 'Technical Portfolio' | 'SaaS MVP' | 'Learning Project' | 'Testing Showcase';

export interface ProjectIdea {
  title: string;
  description: string;
  techStack: string[];
  features: string[];
  successRoadmap: string;
  goal: ProjectGoal;
  plan: 'free' | 'pro' | 'enterprise';
}

export async function generateIdeas(jobTitle: string, goal: ProjectGoal, userId: string, plan: 'free' | 'pro' | 'enterprise' = 'free'): Promise<ProjectIdea[]> {
  if (!jobTitle) {
    throw new Error("Target title or niche is required");
  }

  const profile = await getUserProfile(userId);
  const scaffoldingRules = (plan === 'enterprise' && profile?.scaffolding_rules) 
    ? `MANDATORY ARCHITECTURAL CONSTRAINTS YOU MUST FOLLOW: ${profile.scaffolding_rules}` 
    : "";

  const model = (plan === 'pro' || plan === 'enterprise') ? "llama-3.3-70b-versatile" : "llama-3.1-8b-instant";

  try {
    const jsonInstruction = "CRITICAL: You must respond ONLY with valid, minified JSON. Do not include any conversational text, preambles, postambles, or markdown formatting like ```json. Your response must begin with { and end with }. CRITICAL: You are generating code inside JSON. You MUST properly escape all double quotes (\"), backslashes (\\), and newlines (\n) within your string values. Failure to escape these will break the JSON parser.";

    const response = await groq.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: `You are an expert product strategist and senior engineer.
Your task is to suggest exactly 3 realistic, impressive project ideas tailored for the user's target title/niche and their specific goal: ${goal}.

${scaffoldingRules}

The output MUST be a strict JSON object with a single root key called "projects".
The "projects" array must contain exactly 3 objects.
Each object must have the following keys:
- "title": A catchy, professional name for the project.
- "description": A concise, 1-2 sentence description. 
    - If goal is 'SaaS MVP', focus on solving a problem for users.
    - If goal is 'Learning Project', focus on educational value.
    - If goal is 'Technical Portfolio', focus on engineering depth.
- "techStack": An array of strings.
- "features": An array of exactly 3 high-impact features (strings).
- "successRoadmap": A 1-sentence roadmap for the project's next steps.
    - If 'SaaS MVP', focus on product-market fit and launch.
    - If 'Technical Portfolio', focus on code quality and architecture.
    - If 'Learning Project', focus on key concepts to master.
    - If 'Testing Showcase', focus on reliability and automation.
- "goal": Must be exactly "${goal}".
- "plan": Must be exactly "${plan}".
- "error": Optional. If the user input is nonsensical, purely numeric, or gibberish (e.g., "123123", "asdfgh"), set this to "Invalid Input" and provide a helpful message in "message".

CRITICAL: If the input is detected as gibberish, do NOT generate projects. Instead, return: {"error": "Invalid Input", "message": "Please provide a valid industry or project goal to begin synthesis."}

${jsonInstruction}`,
        },
        {
          role: "user",
          content: `Generate 3 project ideas for the following target: ${jobTitle}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content received from Groq API");
    }

    // Bulletproof JSON Extraction & Parsing
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("Failed to parse AI ideas:", e, content);
      throw new Error("AI generated malformed ideas. Please try again.");
    }

    if (!parsed.projects || !Array.isArray(parsed.projects)) {
      if (parsed.error === "Invalid Input") {
        throw new Error(parsed.message || "Invalid input detected");
      }
      throw new Error("Invalid response structure from Groq API");
    }

    return parsed.projects as ProjectIdea[];
  } catch (error) {
    console.error("Failed to generate ideas:", error);
    throw new Error("Failed to generate project ideas. Please try again.");
  }
}