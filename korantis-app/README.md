This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Korantis Auth / Admin Safety

Admin API routes are closed by default. Set this server-only env var in Vercel for allowed admin accounts:

```bash
KORANTIS_ADMIN_EMAILS=founder@example.com,ops@example.com
```

After enabling user authentication, apply the RLS hardening migration manually in Supabase SQL editor:

```text
supabase/migrations/08_auth_rls_hardening.sql
```

The migration keeps public reads limited to active venues and their images, while `profiles` and `venue_interactions` are restricted to the authenticated owner.

### Production Domain / OAuth Checklist

Canonical production domain:

```text
https://www.korantis.com
```

The apex domain redirects to the canonical host:

```text
https://korantis.com -> https://www.korantis.com
```

Supabase Auth should allow these redirect URLs:

```text
https://www.korantis.com/auth/callback
https://korantis.com/auth/callback
https://korantisai-4qzs.vercel.app/auth/callback
https://korantisai-4qzs-git-main-korantis-projects.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

Google OAuth should use the Supabase callback URL as the authorized redirect URI:

```text
https://xdinpaabgsuqcnweabxi.supabase.co/auth/v1/callback
```

Authorized JavaScript origins should include:

```text
https://www.korantis.com
https://korantis.com
https://korantisai-4qzs.vercel.app
http://localhost:3000
```

The app sends auth callbacks to `window.location.origin + "/auth/callback"`, so local dev, Vercel previews, and the production domain work without code changes as long as Supabase and Google contain the matching allowed URLs.

## Publication Gate

Stage 12 is the final activation gate for public venues. A venue cannot be activated unless it has:

- a Cloudinary-backed hero image
- at least 2 `venue_images` rows with `role = 'gallery'` and a usable `url` or `secure_url`

This prevents newly published venues from appearing with a swipe/gallery affordance but no real gallery depth.
