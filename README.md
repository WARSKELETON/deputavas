This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Environment Variables

Copy the example environment file and configure your settings:

```bash
cp .env.local.example .env.local
```

#### Google AdSense (Optional)

To enable ads on the site, add your AdSense credentials:

```
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_ADSENSE_SLOT_ID=XXXXXXXXXX
```

Get these from your [AdSense dashboard](https://www.google.com/adsense/) under **Ads > By ad unit**.

### Running the Development Server

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

## Scrapers

### Deputados

```bash
npm run scrape:deputados
```

### Projetos de Lei (Legislatura XVII, Sessao 1)

```bash
npm run scrape:projetos-lei
```

Optional overrides:

```bash
LEGISLATURE=XVII SESSION=1 TYPE="Projeto de Lei" EXPECTED_TOTAL=410 KEEP_EXISTING=1 npm run scrape:projetos-lei
```

The scraper writes to `src/data/projetos-lei.json`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
