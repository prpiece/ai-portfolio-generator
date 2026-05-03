---
name: mvp-stack-rules
description: Core architecture rules for the GitHub Project Generator app.
---
## Tech Stack
- Framework: Next.js (App Router)
- Backend/Auth: Firebase (Firestore & Authentication)
- UI: Tailwind CSS + Shadcn/ui
- APIs: GitHub REST API, Claude 3.5 Sonnet API

## Conventions
- Prioritize server actions over API routes where possible.
- Keep UI components small and reusable.
- Always output an `implementation_plan.md` artifact before writing complex logic.