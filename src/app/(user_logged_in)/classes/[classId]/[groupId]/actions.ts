// app/actions/subGroupActions.ts

"use server"

import { sql, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { generateUuidWithPrefix } from "~/server/db/helperFunction";
import { student_sub_groups, sub_groups } from "~/server/db/schema";

// Create a new sub-group and, if provided, add student enrollments.
export async function createSubGroup({
  group_id,
  sub_group_name,
  class_id,
  studentIds = [],
}: {
  group_id: string;
  sub_group_name: string;
  class_id: string;
  studentIds?: string[];
}) {
  "use server";

  // Generate a unique ID for the sub-group.
  const subGroupId = generateUuidWithPrefix("subgroup_");

  // Insert a new record into the sub_groups table.
  await db.insert(sub_groups).values({
    sub_group_id: subGroupId,
    group_id,
    sub_group_name,
    class_id,
    // created_date and updated_date are auto-handled via defaults.
  });

  // If student IDs are provided, enroll them in the sub-group.
  if (studentIds.length > 0) {
    const enrollments = studentIds.map((student_id) => ({
      enrollment_id: generateUuidWithPrefix(""),
      sub_group_id: subGroupId,
      student_id,
      // enrollment_date will use the default CURRENT_TIMESTAMP.
    }));
    await db.insert(student_sub_groups).values(enrollments);
  }

  return subGroupId;
}

// Save (update) an existing sub-group record and its associated student enrollments.
export async function saveSubGroup({
  sub_group_id,
  group_id,
  sub_group_name,
  class_id,
  studentIds = [],
}: {
  sub_group_id: string;
  group_id: string;
  sub_group_name: string;
  class_id: string;
  studentIds?: string[];
}) {
  "use server";

  // Update the sub_groups record.
  await db.update(sub_groups)
    .set({
      group_id,
      sub_group_name,
      class_id,
      updated_date: sql`CURRENT_TIMESTAMP`, // update timestamp
    })
    .where(eq(sub_groups.sub_group_id, sub_group_id));

  // Remove all existing student enrollments for this sub-group.
  await db.delete(student_sub_groups)
    .where(eq(student_sub_groups.sub_group_id, sub_group_id));

  // Insert the new set of student enrollments, if any.
  if (studentIds.length > 0) {
    const enrollments = studentIds.map((student_id) => ({
      enrollment_id: generateUuidWithPrefix(""),
      sub_group_id,
      student_id,
    }));
    await db.insert(student_sub_groups).values(enrollments);
  }

  return sub_group_id;
}

// Delete a sub-group and all associated student enrollments.
export async function deleteSubGroup(sub_group_id: string) {
  "use server";

  // Delete enrollments from student_sub_groups first.
  await db.delete(student_sub_groups)
    .where(eq(student_sub_groups.sub_group_id, sub_group_id));

  // Then delete the sub-group record.
  await db.delete(sub_groups)
    .where(eq(sub_groups.sub_group_id, sub_group_id));

  return sub_group_id;
}
