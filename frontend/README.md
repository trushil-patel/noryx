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

## Web Analytics

Vercel Web Analytics is included globally through `@vercel/analytics/next` in `app/layout.tsx`. Enable Web Analytics in the Vercel project dashboard, then deploy to start collecting page views. No additional environment variables are required.

See the [Vercel Web Analytics setup guide](https://vercel.com/docs/analytics/quickstart).


## Library loading

The library reads its card fields directly from Supabase using the signed-in user's
JWT, the existing SELECT RLS policies on `knowledge_items` and `knowledge_tags`,
and an explicit `user_id` filter. This avoids the extra backend hop for reads;
AI operations and mutations still use FastAPI. Do not use a service-role key in
the frontend or disable RLS to enable these reads.

A versioned, per-user browser snapshot displays cards immediately on return visits
while the database refreshes in the background. Snapshots expire after 24 hours
and are cleared on sign-out. Successful capture, delete, and tag changes update
the current user's snapshot. Storage failures fall back to in-memory caching;
first visits without a snapshot still require a database request.

Run `npm test` (Node 22.6+), `npm run lint`, and `npm run build` to verify changes.
The cache tests cover delayed requests, account separation, mutation races,
sign-out, expiration, corrupted storage, and offline recovery.
