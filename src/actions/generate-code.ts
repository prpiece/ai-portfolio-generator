"use server";

import OpenAI from "openai";
import { getServerSupabase } from "@/lib/supabase";
import { deductCredit, getUserProfile, addProjectLog } from "./db-actions";
import { ProjectIdea } from "./generate-ideas";

const groq = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    "X-Title": "AI Project Generator",
  }
});

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface GenerationResponse {
  plan: 'free' | 'pro' | 'enterprise';
  files: GeneratedFile[];
  nextSteps: string;
  architectureExplanation?: string;
}

export async function generateProjectCode(idea: ProjectIdea, userId: string, projectId?: string): Promise<GenerationResponse> {
  // 1. Fetch User Profile & Check Credits
  const profile = await getUserProfile(userId);
  
  if (!profile) {
    throw new Error("User profile not found");
  }

  if (profile.credits <= 0) {
    throw new Error("INSUFFICIENT_CREDITS");
  }

  const plan = profile.plan;
  let model = "";
  let systemPrompt = "";

  const devOpsInstruction = "Act as a 'Full-Stack DevOps Engineer'. Do not just provide UI components; provide the necessary API routes, validation logic, and backend scaffolding to make the feature functional.";
  const environmentInstruction = "ENVIRONMENT-FIRST: You MUST include a root-level 'package.json' with all dependencies, a '.env.example' file, framework configs (e.g., next.config.js), and a comprehensive 'README.md' with setup commands.";
  const errorFreeInstruction = "ERROR-FREE GUARANTEE: Before finalizing, mentally compile the code. Fix any missing imports, undefined variables, or syntax errors. Every file MUST be syntactically correct and use proper relative imports.";
  const scaffoldingRules = profile.scaffolding_rules ? `MANDATORY ARCHITECTURAL CONSTRAINTS: ${profile.scaffolding_rules}` : "";

  switch (plan) {
    case 'free':
      model = "meta-llama/llama-3-8b-instruct:free";
      systemPrompt = `You are an architecture assistant. Provide ONLY a high-level project plan, a folder structure tree, and the terminal commands to initialize the project. Do NOT write functional code. Return your response in JSON format containing plan, files[] (empty or just structure), and nextSteps.`;
      break;
    
    case 'pro':
      model = "meta-llama/llama-3.3-70b-instruct";
      systemPrompt = `You are a senior developer. ${devOpsInstruction} Write 60-70% of the functional boilerplate code. Provide solid scaffolding, routing, and component structures. ${environmentInstruction} ${errorFreeInstruction}`;
      break;

    case 'enterprise':
      model = "openai/gpt-4o";
      systemPrompt = `You are an elite system architect. ${devOpsInstruction} Write 85-95% of complete, production-ready code. Include advanced configurations, state management, and strict typings. ${environmentInstruction} ${errorFreeInstruction} ${scaffoldingRules}`;
      break;
    
    default:
      model = "meta-llama/llama-3-8b-instruct:free";
      systemPrompt = "You are a helpful assistant.";
  }

  if (projectId) {
    await addProjectLog(projectId, "Initializing AI Synthesis Engine...", "info");
    await addProjectLog(projectId, `Deploying tiered intelligence model: ${model.split('/')[1] || model}...`, "info");
  }

  try {
    const jsonInstruction = "CRITICAL: You must respond ONLY with valid, minified JSON. Do not include any conversational text, preambles, postambles, or markdown formatting like ```json. Your response must begin with { and end with }.";

    const response = await groq.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: `${systemPrompt}
          
          The output MUST be a strict JSON object with the following structure:
          {
            "plan": "${plan}",
            "files": [
              { "path": "string", "content": "string" }
            ],
            "nextSteps": "string",
            "error": "Optional string if input is gibberish"
          }
          
          CRITICAL: If the project title or description is detected as gibberish, nonsensical, or purely numeric, do NOT generate files. Instead, return: {"error": "Invalid Input", "message": "The project context appears to be invalid. Please provide a clear title and description."}
          
          Focus on creating a modern Next.js application.
          
          ${jsonInstruction}`,
        },
        {
          role: "user",
          content: `Generate the code for the following project:
          Title: ${idea.title}
          Description: ${idea.description}
          Goal: ${idea.goal}
          Tech Stack: ${idea.techStack.join(", ")}
          Features: ${idea.features?.join(", ") || "Standard features"}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No content from OpenRouter");

    if (projectId) await addProjectLog(projectId, "Code synthesis successful. Validating structure...", "info");

    // Bulletproof JSON Extraction
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in response:", content);
      throw new Error("No JSON found in response");
    }
    const parsed = JSON.parse(jsonMatch[0]) as GenerationResponse & { error?: string, message?: string };

    if (parsed.error === "Invalid Input") {
      throw new Error(parsed.message || "Invalid input detected during code synthesis");
    }

    // 3. Deduct Credit
    await deductCredit(userId);

    if (projectId) await addProjectLog(projectId, "Project components synthesized successfully.", "success");

    return parsed;
  } catch (error: any) {
    console.error("OpenRouter Generation failed:", error);
    if (projectId) await addProjectLog(projectId, `Synthesis failure: ${error.message}`, "error");
    throw new Error(error.message || "Failed to generate project code");
  }
}
