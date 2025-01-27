# Using a Monorepo on Vercel and Cloudflare

This walk you through using a monorepo that is hosted on Vercel with subdoamins configured on Cloudflare.

## Subdomains

Follow the [domains.md]() file to create the necessary subdomains.

## Setting Root Directory

In order for Vercel to use the correct folder for each project that you created when configuring your subdomains, you need to set the root directory of each.

1. Go to Settings
2. Click General
3. Set Root Directory to...
    - /app
    - /blog
    - /web
    - /docs
    - /api