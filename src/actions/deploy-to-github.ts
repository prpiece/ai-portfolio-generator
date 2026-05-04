"use server";

import { Octokit } from "@octokit/rest";
import { GeneratedFile } from "./generate-code";
import { ProjectIdea } from "./generate-ideas";
import { addProjectLog } from "./db-actions";

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-"); // Replace multiple - with single -
}

export async function deployToGithub(idea: ProjectIdea, token: string, aiFiles?: GeneratedFile[], projectId?: string): Promise<string> {
  if (!token) {
    throw new Error("GitHub token is required");
  }

  if (projectId) await addProjectLog(projectId, "Initializing GitHub connection...", "info");

  const octokit = new Octokit({ auth: token });
  const repoName = slugify(idea.title);

  try {
    // 1. Create Repository
    if (projectId) await addProjectLog(projectId, `Creating private repository: ${repoName}...`, "info");
    
    const { data: repo } = await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      description: idea.description,
      private: true,
      auto_init: true, 
    });

    const owner = repo.owner.login;
    if (projectId) await addProjectLog(projectId, "Repository provisioned successfully.", "success");

    // 2. Wait for auto_init
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 3. Deploy AI Files if available
    if (aiFiles && aiFiles.length > 0) {
      if (projectId) await addProjectLog(projectId, `Synthesizing ${aiFiles.length} project files into repository...`, "info");
      
      for (const file of aiFiles) {
        let sha: string | undefined;
        if (file.path === "README.md") {
          try {
            const { data: existingFile } = await octokit.repos.getContent({
              owner,
              repo: repoName,
              path: "README.md",
            });
            if (!Array.isArray(existingFile)) sha = existingFile.sha;
          } catch (e) {}
        }

        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo: repoName,
          path: file.path,
          message: `feat: generate ${file.path}`,
          content: Buffer.from(file.content).toString("base64"),
          sha: sha,
        });
      }
    } else {
      // FALLBACK logic (truncated for brevity in instructions, but keeping it for the file)
      if (projectId) await addProjectLog(projectId, "Using fallback architecture template...", "info");
      // ... (rest of the fallback logic remains the same)
      // I'll keep the full original logic below to ensure no regression
      let readmeSha: string | undefined;
      try {
        const { data: readmeFile } = await octokit.repos.getContent({
          owner,
          repo: repoName,
          path: "README.md",
        });
        if (!Array.isArray(readmeFile) && readmeFile.type === "file") {
          readmeSha = readmeFile.sha;
        }
      } catch (e) {}

      const isSaaS = idea.goal === 'SaaS MVP';
      const isPortfolio = idea.goal === 'Technical Portfolio';

      const readmeContent = `# ${idea.title}\n\n## Overview\n${idea.description}\n\n## Tech Stack\n${idea.techStack.map((tech) => `- ${tech}`).join("\n")}\n\n## Key Features\n${idea.features.map((feature) => `- ${feature}`).join("\n")}\n\n## Success Roadmap\n${idea.successRoadmap}`;

      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo: repoName,
        path: "README.md",
        message: `docs: initialize README for ${idea.goal}`,
        content: Buffer.from(readmeContent).toString("base64"),
        sha: readmeSha,
      });

      const packageJsonContent = {
        name: repoName,
        version: "0.1.0",
        description: idea.description,
        private: true,
        scripts: { dev: "next dev", build: "next build", start: "next start" },
        dependencies: idea.techStack.reduce((acc, tech) => { acc[slugify(tech)] = "latest"; return acc; }, {} as Record<string, string>),
      };

      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo: repoName,
        path: "package.json",
        message: "chore: initialize package.json",
        content: Buffer.from(JSON.stringify(packageJsonContent, null, 2)).toString("base64"),
      });

      const layoutContent = `import "./globals.css";\nimport type { Metadata } from "next";\n\nexport const metadata: Metadata = {\n  title: "${idea.title}",\n  description: "${idea.description}",\n};\n\nexport default function RootLayout({ children }: { children: React.ReactNode; }) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  );\n}\n`;

      await octokit.repos.createOrUpdateFileContents({ owner, repo: repoName, path: "app/layout.tsx", message: "feat: add root layout", content: Buffer.from(layoutContent).toString("base64"), });

      const pageContent = `export default function Home() {\n  return (\n    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-white text-black">\n      <h1 className="text-4xl font-bold mb-4">${idea.title}</h1>\n      <section id="description" className="text-xl text-gray-600 max-w-2xl text-center mb-12">\n        <p>${idea.description}</p>\n      </section>\n    </main>\n  );\n}\n`;

      await octokit.repos.createOrUpdateFileContents({ owner, repo: repoName, path: "app/page.tsx", message: `feat: add home page for ${idea.goal}`, content: Buffer.from(pageContent).toString("base64"), });
    }

    if (projectId) await addProjectLog(projectId, "GitHub repository synchronization complete.", "success");
    return repo.html_url;
  } catch (error: any) {
    console.error("Deploy failed:", error);
    if (projectId) await addProjectLog(projectId, `Deployment failure: ${error.message}`, "error");
    throw new Error(error.message || "Failed to deploy to GitHub");
  }
}
