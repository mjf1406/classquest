"use server";

import { z } from "zod";
import { db } from "~/server/db"; // adjust import as needed
import { expectations } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

// Define Zod schema for incoming data
const UpdateExpectationSchema = z.object({
  classId: z.string(),
  expectationId: z.string(),
  name: z.string(),
  description: z.string(),
});

interface UpdateExpectationParams {
  classId: string;
  expectationId: string;
  name: string;
  description: string;
}

// This is a server action
export async function updateExpectation(
  data: UpdateExpectationParams
) {
  const parsed = UpdateExpectationSchema.parse(data);

  const { userId } = auth();
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const currentTimestamp = new Date().toISOString();

  // Update the expectation record in the database
  await db
    .update(expectations)
    .set({
      name: parsed.name,
      description: parsed.description,
      updated_date: currentTimestamp,
    })
    .where(eq(expectations.id, parsed.expectationId))
    .run();

  return { success: true };
}
