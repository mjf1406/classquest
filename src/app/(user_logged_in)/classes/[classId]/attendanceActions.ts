// attendanceActions.ts

"use server";

import { db } from "~/server/db";
import { absent_dates, student_classes } from "~/server/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray } from "drizzle-orm";
import { generateUuidWithPrefix } from "~/server/db/helperFunction";

export async function saveAttendance(
  class_id: string,
  date: string,
  absent_student_ids: string[],
  student_ids_to_update?: string[]
): Promise<{ success: boolean; message: string }> {
  const { userId } = auth();
  if (!userId) {
    return { success: false, message: "User not authenticated." };
  }

  try {
    // Start a transaction
    await db.transaction(async (tx) => {
      // Fetch enrollments for only the given students (if provided) or all students in the class
      let enrollments;
      if (student_ids_to_update && student_ids_to_update.length > 0) {
        enrollments = await tx
          .select()
          .from(student_classes)
          .where(
            and(
              eq(student_classes.class_id, class_id),
              inArray(student_classes.student_id, student_ids_to_update)
            )
          )
          .all();
      } else {
        enrollments = await tx
          .select()
          .from(student_classes)
          .where(eq(student_classes.class_id, class_id))
          .all();
      }

      // Create a Set of enrolled student_ids (only from the provided subset)
      const enrolledStudentIds = new Set(
        enrollments.map((enrollment) => enrollment.student_id)
      );

      // Validate absent_student_ids to include only enrolled students
      const validAbsentStudentIds = absent_student_ids.filter((student_id) =>
        enrolledStudentIds.has(student_id)
      );

      // Fetch existing absence records for only the given students (if provided) or for the whole class
      let existingAbsences;
      if (student_ids_to_update && student_ids_to_update.length > 0) {
        existingAbsences = await tx
          .select()
          .from(absent_dates)
          .where(
            and(
              eq(absent_dates.class_id, class_id),
              eq(absent_dates.date, date),
              inArray(absent_dates.student_id, student_ids_to_update)
            )
          )
          .all();
      } else {
        existingAbsences = await tx
          .select()
          .from(absent_dates)
          .where(and(eq(absent_dates.class_id, class_id), eq(absent_dates.date, date)))
          .all();
      }

      // Create a Set of student_ids currently marked as absent on that date (for the subset)
      const existingAbsentStudentIds = new Set(
        existingAbsences.map((record) => record.student_id)
      );

      // Determine students to add (absent now but not previously)
      const studentsToAdd = validAbsentStudentIds.filter(
        (student_id) => !existingAbsentStudentIds.has(student_id)
      );

      // Determine students to remove (previously absent but not absent now)
      const studentsToRemove = Array.from(existingAbsentStudentIds).filter(
        (student_id) => !validAbsentStudentIds.includes(student_id)
      );

      // Insert absence records for studentsToAdd
      if (studentsToAdd.length > 0) {
        const absenceRecordsToInsert = studentsToAdd.map((student_id) => ({
          id: generateUuidWithPrefix("absence_"),
          user_id: userId,
          class_id: class_id,
          student_id: student_id,
          date: date,
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString(),
        }));

        await tx.insert(absent_dates).values(absenceRecordsToInsert).run();
      }

      // Delete absence records for studentsToRemove
      if (studentsToRemove.length > 0) {
        await tx
          .delete(absent_dates)
          .where(
            and(
              eq(absent_dates.class_id, class_id),
              eq(absent_dates.date, date),
              inArray(absent_dates.student_id, studentsToRemove)
            )
          )
          .run();
      }
    });

    return { success: true, message: "Attendance saved successfully." };
  } catch (error) {
    console.error("Error saving attendance:", error);
    return { success: false, message: "Failed to save attendance." };
  }
}
