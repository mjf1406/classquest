"use server";

import { z } from "zod";
import { db } from "~/server/db"; // adjust import as needed
import { expectations } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

const DeleteExpectationSchema = z.object({
  expectationId: z.string(),
});

interface DeleteExpectationParams {
  expectationId: string;
}

// This is a server action
export async function deleteExpectation(
  data: DeleteExpectationParams
) {
  const parsed = DeleteExpectationSchema.parse(data);

  const { userId } = auth();
  if (!userId) {
    throw new Error("Not authenticated");
  }

  await db
    .delete(expectations)
    .where(eq(expectations.id, parsed.expectationId))
    .run();

  return { success: true };
}
