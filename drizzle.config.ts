// import { type Config } from "drizzle-kit";
// import { env } from "~/env";

// export default {
//   schema: "./src/server/db/schema.ts",
//   out: './drizzle',
//   dialect: "sqlite",
//   driver: "turso",
//   dbCredentials: {
//     url: env.TURSO_DATABASE_URL,
//     authToken: env.TURSO_AUTH_TOKEN,
//   },
// } satisfies Config;

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './migrations',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
});
