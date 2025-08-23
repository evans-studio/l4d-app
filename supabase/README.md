# Supabase directory

This folder enables Supabase Branching and schema versioning.

## One-time setup
1. Install CLI (macOS):
   brew install supabase/tap/supabase
2. Pull current production schema into this folder:
   supabase init
   supabase link --project-ref <PROD_REF>
   supabase db pull
   git add supabase && git commit -m "chore(supabase): add baseline schema"

## Create a staging DB (separate project) or use Branching
- Separate project (simple): link to staging and push schema:
  supabase link --project-ref <STAGING_REF> --override
  supabase db push

- Branching (per-PR DB): enable Branching in Supabase Studio, select repo and this "supabase" directory, production branch "main".
  Supabase will provision an isolated DB per branch/PR.

## Seeding minimal data
- Create only the two admin users in the target (staging/branch) via Studio Auth → Add user.
- Or run our script with that environment: tsx src/lib/scripts/create-admin-users.ts

## Notes
- App connects via environment variables. Point Preview envs to staging/branch DB.
- Do not run destructive migrations directly on production. Use additive, backward-compatible changes.
