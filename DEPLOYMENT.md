Deployment Checklist — Vercel
=================================

This project is ready for deployment to Vercel. Follow the steps below to create a production deployment and configure required environment variables.

1) Repository
- Ensure the repository is connected: `git@github.com:oparahebukaoscar-cyber/transvera.git` (already pushed).

2) Required Environment Variables (add these in Vercel project settings - Environment Variables):
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon public key (public)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-only)
- `SUPABASE_DB_URL` — Postgres connection string (only if you run DB scripts on the server)
- `NEXT_PUBLIC_OPENWEATHERMAP_KEY` — (optional) for weather features
- `ADMIN_API_KEY` — (optional) guard for admin API endpoints

Notes:
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_DB_URL` as public variables; mark them as "Secret"/server-only in Vercel.
- Use Vercel environment scopes (Preview/Production) appropriately.

3) Deploy via the Vercel dashboard (recommended)
- Go to https://vercel.com, sign in with your GitHub account, and choose "Import Project" → select `oparahebukaoscar-cyber/transvera`.
- In the Environment Variables section add the variables above.
- Click "Deploy".

4) Deploy via Vercel CLI (alternative)
```bash
npm i -g vercel
vercel login
cd path/to/ship-modern-ui
vercel link   # follow prompts to link to the GitHub project
vercel --prod
```

5) Post-deploy checks
- Visit the production URL from Vercel after deploy and ensure pages load.
- Check console for any errors and the build logs in Vercel for warnings/errors.

6) If you use Supabase server scripts (seeding)
- Run local scripts only after setting `SUPABASE_DB_URL` or use the Supabase UI directly.
  Example (local):
  ```bash
  SUPABASE_DB_URL="<your-connection-string>" node scripts/insert_test_asset.js
  ```

7) Additional tips
- We ran `npm run build` locally and the build completed successfully.
- If you want the dashboard page entirely hidden, there were no header/footer links to `/dashboard` in the global `Navbar` or `Footer`, so no link removal was necessary.

If you want, I can attempt a Vercel CLI deployment now (requires your Vercel account authentication) or walk you through the Vercel dashboard steps.
