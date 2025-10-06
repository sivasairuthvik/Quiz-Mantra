Deploying the frontend to Vercel

This file lists the exact steps and recommended settings to deploy the `frontend` app in this repository to Vercel.

1. Prerequisites
   - You need a Vercel account (https://vercel.com/).
   - Install Vercel CLI (optional): `npm i -g vercel`.

2. Project detection
   - In Vercel, create a new project and import from your Git provider (GitHub/GitLab/Bitbucket). Select the repository `Quiz-Mantra` and the `frontend` directory as the root (if Vercel asks for a framework, choose "Other" or "Vite").

3. Build & Output settings (set these in the Vercel project settings or during import):
   - Root Directory: `frontend` (important if you imported the monorepo)
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. Environment variables
   - This project uses Vite environment variables. Any variable accessed in browser code must be prefixed with `VITE_`.
   - Add the following environment variables in Vercel for the appropriate environments (Preview/Production):
     - `VITE_API_URL` = https://your-api.example.com (replace with your backend URL)

   - Note: `.env` in the repo contains `VITE_API_URL=http://localhost:5000` for local development only. Do not commit production secrets to the repo.

5. SPA routing
   - `vercel.json` in the `frontend` folder forces all routes to `index.html` so client-side routing works. No further setup required.

6. Optional: Using Vercel CLI
   - From `frontend` folder run:

     vercel --prod

   - The CLI will walk you through linking the project. Use `-A vercel.json` if using the config file explicitly.

7. Troubleshooting
   - If builds fail, inspect the Vercel build logs. Common issues:
     - Missing environment variables
     - Build errors due to Node version (set Node version in Vercel settings if needed)
     - Proxy to backend: the dev `server.proxy` is only for local dev. Update any API calls to use the `VITE_API_URL` variable in production.

8. Verification
   - After deployment, open the Vercel URL. Navigate client routes (e.g., `/quizzes`) to ensure SPA routing works.

If you'd like, I can also: create a GitHub Action to automatically deploy the `frontend` to Vercel, or prepare a small script to help set Vercel environment variables via their CLI. Tell me which you'd prefer.