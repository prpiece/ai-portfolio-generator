"use server";

import { Octokit } from "@octokit/rest";
import { ProjectIdea } from "./generate-ideas";

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-"); // Replace multiple - with single -
}

export async function deployToGithub(idea: ProjectIdea, token: string): Promise<string> {
  if (!token) {
    throw new Error("GitHub token is required");
  }

  const octokit = new Octokit({ auth: token });
  const repoName = slugify(idea.title);

  try {
    // 1. Create Repository
    const { data: repo } = await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      description: idea.description,
      private: false,
      auto_init: true, // Creates an initial commit with empty README, so we can update it
    });

    const owner = repo.owner.login;

    // 2. Wait a brief moment for auto_init to complete on GitHub's end
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Get the SHA of the initial README
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
    } catch (e) {
      console.warn("Could not find initial README to update", e);
    }

    // 3. Create rich README.md
    const readmeContent = `# ${idea.title}

## Description
${idea.description}

## Tech Stack
${idea.techStack.map((tech) => `- ${tech}`).join("\n")}

## Test Strategy
${idea.testStrategy}
`;

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo: repoName,
      path: "README.md",
      message: "docs: add comprehensive README",
      content: Buffer.from(readmeContent).toString("base64"),
      sha: readmeSha,
    });

    // 4. Create package.json
    const packageJsonContent = {
      name: repoName,
      version: "0.1.0",
      description: idea.description,
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
      },
      dependencies: idea.techStack.reduce((acc, tech) => {
        // Just adding fake versions for the MVP bonus requirement
        acc[slugify(tech)] = "latest";
        return acc;
      }, {} as Record<string, string>),
    };

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo: repoName,
      path: "package.json",
      message: "chore: initialize package.json",
      content: Buffer.from(JSON.stringify(packageJsonContent, null, 2)).toString("base64"),
    });

    // 5. Create app/layout.tsx
    const layoutContent = `import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "${idea.title}",
  description: "${idea.description}",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo: repoName,
      path: "app/layout.tsx",
      message: "feat: add root layout",
      content: Buffer.from(layoutContent).toString("base64"),
    });

    // 6. Create app/page.tsx
    const pageContent = `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">${idea.title}</h1>
      <p className="text-xl text-gray-600 max-w-2xl text-center">
        ${idea.description}
      </p>
    </main>
  );
}
`;

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo: repoName,
      path: "app/page.tsx",
      message: "feat: add home page",
      content: Buffer.from(pageContent).toString("base64"),
    });

    // 7. Create tests/page.test.tsx
    const testContent = `import { render, screen } from "@testing-library/react";
import Home from "../app/page";

describe("Home Page", () => {
  it("renders the project title", () => {
    render(<Home />);
    const heading = screen.getByText(/${idea.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/i);
    expect(heading).toBeInTheDocument();
  });
});
`;

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo: repoName,
      path: "tests/page.test.tsx",
      message: "test: add initial unit test",
      content: Buffer.from(testContent).toString("base64"),
    });

    return repo.html_url;
  } catch (error: any) {
    console.error("Deploy failed:", error);
    throw new Error(error.message || "Failed to deploy to GitHub");
  }
}
