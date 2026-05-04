"use server";

import { generateProjectCode } from "./generate-code";
import { deployToGithub } from "./deploy-to-github";
import { addProjectLog, SavedProject } from "./db-actions";
import { getServerSupabase } from "@/lib/supabase";
import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export async function startProjectBuild(projectId: string, idea: any, userId: string, githubToken: string) {
  try {
    await addProjectLog(projectId, "Build pipeline initialized by user...", "info");
    
    // 1. Generate
    const generation = await generateProjectCode(idea, userId, projectId);
    
    // 2. Deploy
    const githubUrl = await deployToGithub(idea, githubToken, generation.files, projectId);
    
    // 3. Update Project
    const supabase = getServerSupabase();
    const { error } = await supabase.from('projects').update({
      github_url: githubUrl,
      next_steps: generation.nextSteps
    }).eq('id', projectId);

    if (error) throw new Error(`Update failed: ${error.message}`);

    await addProjectLog(projectId, "Finalizing deployment pipeline...", "info");
    await addProjectLog(projectId, "PROJECT_READY_FOR_USE", "success");

    return { success: true, githubUrl };
  } catch (err: any) {
    console.error("Build failed:", err);
    await addProjectLog(projectId, `Critical Failure: ${err.message}`, "error");
    throw err;
  }
}

export async function iterateProject(projectId: string, githubToken: string, instructions: string) {
  const supabase = getServerSupabase();
  
  // 1. Fetch Project Data
  const { data: project, error: pError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (pError || !project) throw new Error("Project not found");

  await addProjectLog(projectId, "Initializing Magic Edit sequence...", "info");

  try {
    // 2. Generate Iteration Code
    await addProjectLog(projectId, "Analyzing existing codebase and calculating diff...", "info");
    
    const prompt = `You are a Senior Engineer. Iterating on the project: "${project.title}".
    Existing Description: ${project.description}
    User Instruction: "${instructions}"
    
    Generate ONLY the specific files that need to be created or updated to satisfy the user instruction.
    Return a JSON object: { "files": [{ "path": "string", "content": "string" }], "commitMessage": "string" }
    Focus on Next.js 14+ (App Router).`;

    const response = await groq.chat.completions.create({
      model: "openai/gpt-4o",
      messages: [{ role: "system", content: prompt + "\nRespond ONLY with valid JSON." }],
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(response.choices[0].message.content || "{}");
    const { files, commitMessage } = parsed;

    if (!files || files.length === 0) throw new Error("AI failed to generate update files");

    await addProjectLog(projectId, `Synthesizing ${files.length} modified components...`, "info");

    // 3. Push to GitHub
    const idea = { title: project.title, description: project.description } as any;
    await deployToGithub(idea, githubToken, files, projectId);

    await addProjectLog(projectId, "Magic Edit applied and pushed to GitHub.", "success");
    return { success: true };
  } catch (err: any) {
    console.error("Iteration failed:", err);
    await addProjectLog(projectId, `Magic Edit Failure: ${err.message}`, "error");
    throw err;
  }
}
