import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getServerSupabase } from '@/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    "X-Title": "AI Project Generator",
  }
});

export async function POST(req: Request) {
  try {
    const { idea, userId } = await req.json();
    
    // 1. Authenticate & Check Credits
    const supabase = getServerSupabase();
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('uid', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (profile.credits <= 0) {
      return NextResponse.json({ error: "INSUFFICIENT_CREDITS" }, { status: 403 });
    }

    const plan = profile.plan;

    const qualityInstruction = "QUALITY STANDARDS: Generate code using Next.js 14 (App Router), TypeScript, Tailwind CSS, and Shadcn/UI patterns. Use Lucide icons for UI. Follow 'Clean Architecture' principles: keep UI separate from logic using custom hooks. Use Zod for form validation and implement proper error boundaries.";
    const aestheticInstruction = "AESTHETIC STANDARDS: The generated UI must feel premium. Use smooth gradients, glassmorphism (backdrop-blur), subtle micro-animations with Tailwind/Framer Motion, and a refined, modern color palette.";
    const devOpsInstruction = `Act as a 'Senior Full-Stack & DevOps Engineer'. ${qualityInstruction} ${aestheticInstruction} Do not just provide UI components; provide the necessary API routes, validation logic, and backend scaffolding to make the feature functional.`;
    const environmentInstruction = "ENVIRONMENT-FIRST: You MUST include a root-level 'package.json' with all dependencies (including shadcn/ui, lucide-react, clsx, tailwind-merge), a '.env.example' file, framework configs (e.g., next.config.js), and a comprehensive 'README.md' with setup commands.";
    const errorFreeInstruction = "ERROR-FREE GUARANTEE: Before finalizing, mentally compile the code. Fix any missing imports, undefined variables, or syntax errors. Every file MUST be syntactically correct and use proper relative imports.";

    let model: string;
    let systemPrompt: string;

    switch (plan) {
      case 'free':
        model = "meta-llama/llama-3-8b-instruct:free";
        systemPrompt = `You are a Junior Architecture Assistant. ${qualityInstruction} Provide a high-level project plan, a folder structure tree, and the terminal commands to initialize the project. Do NOT write functional code, but provide the architectural vision. ${environmentInstruction}`;
        break;
      case 'pro':
        // Use GPT-4o as the high-end alternative to Claude
        model = "openai/gpt-4o";
        systemPrompt = `You are a Senior Software Engineer. ${devOpsInstruction} Write 60-70% of the functional boilerplate code. Provide solid scaffolding, routing, and component structures. ${environmentInstruction} ${errorFreeInstruction}`;
        break;
      case 'enterprise':
        model = "openai/gpt-4o";
        systemPrompt = `You are a Staff Software Architect. ${devOpsInstruction} Write 85-95% of complete, production-ready code. Include advanced configurations, state management, and strict typings. ${environmentInstruction} ${errorFreeInstruction}`;
        break;
      default:
        model = "meta-llama/llama-3-8b-instruct:free";
        systemPrompt = "You are a helpful assistant.";
    }

    const jsonInstruction = "CRITICAL: You must respond ONLY with valid, minified JSON. Do not include any conversational text, preambles, postambles, or markdown formatting like ```json. Your response must begin with { and end with }. CRITICAL: You are generating code inside JSON. You MUST properly escape all double quotes (\"), backslashes (\\), and newlines (\n) within your string values. Failure to escape these will break the JSON parser.";

    // 3. AI Generation
    const response = await openai.chat.completions.create({
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
            "nextSteps": "string"
          }
          
          ${jsonInstruction}`,
        },
        {
          role: "user",
          content: `Generate a complete, plug-and-play project for: ${idea.title}. Description: ${idea.description}. Tech: ${idea.techStack.join(', ')}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from AI");

    // Bulletproof JSON Extraction & Parsing
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      result = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("AI JSON Parsing Failed:", parseError, "Raw Content:", content);
      return NextResponse.json({ 
        error: "AI generated malformed code. Please try generating again.",
        retry: true 
      }, { status: 500 });
    }

    // 4. Deduct Credit (Internal RPC or direct update)
    await supabase.rpc('deduct_credit', { user_uid: userId });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("AI Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
