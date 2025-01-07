// ImportServer.tsx

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "~/server/db";
import {
  behaviors,
  classes,
  reward_items,
  teacher_classes,
} from "~/server/db/schema";
import ImportForm from "./ImportForm";

// Define the shape of searchParams
interface ImportPageProps {
  searchParams: {
    import_code?: string; // Mark as optional if it might be undefined
  };
}

export default async function ImportPageServer({
  searchParams,
}: ImportPageProps) {
  const { userId } = auth();
  if (!userId) throw new Error("User not authenticated");

  // Extract the import_code from the search parameters with type safety
  const importCode = searchParams.import_code;

  if (!importCode) {
    throw new Error("Import code is missing from the URL");
  }

  // Fetch classData, behaviorsData, and rewardItemsData concurrently
  const [classData, behaviorsData, rewardItemsData] = await Promise.all([
    // Fetch class data
    db
      .select({
        class_id: classes.class_id,
        class_name: classes.class_name,
      })
      .from(classes)
      .innerJoin(
        teacher_classes,
        eq(classes.class_id, teacher_classes.class_id),
      )
      .where(
        and(
          eq(teacher_classes.user_id, userId),
          eq(teacher_classes.role, "primary"),
        ),
      ),

    // Fetch behaviors data
    db
      .select({
        behavior_id: behaviors.behavior_id,
        name: behaviors.name,
        point_value: behaviors.point_value,
        description: behaviors.description,
        icon: behaviors.icon,
        color: behaviors.color,
        title: behaviors.title,
        created_date: behaviors.created_date,
        updated_date: behaviors.updated_date,
      })
      .from(behaviors)
      .leftJoin(classes, eq(behaviors.class_id, classes.class_id))
      .where(eq(classes.class_code, importCode)),

    // Fetch reward items data
    db
      .select({
        item_id: reward_items.item_id,
        name: reward_items.name,
        description: reward_items.description,
        price: reward_items.price,
        icon: reward_items.icon,
        type: reward_items.type,
        title: reward_items.title,
        created_date: reward_items.created_date,
        updated_date: reward_items.updated_date,
      })
      .from(reward_items)
      .leftJoin(classes, eq(reward_items.class_id, classes.class_id))
      .where(eq(classes.class_code, importCode)),
  ]);

  // Validate classData
  if (classData.length === 0) {
    throw new Error(
      "No class found with the provided import code for this user",
    );
  }

  // Transform behaviorsData: Convert nulls to undefined
  const mappedBehaviorsData = behaviorsData.map((behavior) => ({
    ...behavior,
    description: behavior.description ?? undefined,
    icon: behavior.icon ?? undefined,
    color: behavior.color ?? undefined,
    title: behavior.title ?? undefined,
  }));

  // Transform rewardItemsData: Convert nulls to undefined
  const mappedRewardItemsData = rewardItemsData.map((item) => ({
    ...item,
    description: item.description ?? undefined,
    icon: item.icon ?? undefined,
    title: item.title ?? undefined,
  }));

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">
        Import Data for Class Code {importCode}
      </h1>
      <ImportForm
        classes={classData}
        behaviors={mappedBehaviorsData}
        rewardItems={mappedRewardItemsData}
      />
    </div>
  );
}
