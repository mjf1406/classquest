"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { generateUuidWithPrefix } from "~/server/db/helperFunction";
import { behaviors, reward_items } from "~/server/db/schema";

// Types describing each item you’ll be inserting
interface BehaviorItemInput {
  behavior_id: string;
  name: string;
  point_value: number;
  description?: string;
  icon?: string;
  color?: string;
  title?: string;
}

interface RewardItemInput {
  item_id: string;
  name: string;
  price: number;
  description?: string;
  icon?: string;
  type: "solo" | "group" | "class";
  title?: string;
}

// The shape of the payload you expect
interface ImportPayload {
  classId: string;
  positiveBehaviors?: BehaviorItemInput[];
  negativeBehaviors?: BehaviorItemInput[];
  rewardItems?: RewardItemInput[];
}

export default async function importBehaviorsAndRewardItems({
  classId,
  positiveBehaviors = [],
  negativeBehaviors = [],
  rewardItems = [],
}: ImportPayload) {
  const { userId } = auth();
  if (!userId) throw new Error("User not authenticated");

  try {
    // Start a transaction
    await db.transaction(async (tx) => {
      if (positiveBehaviors.length > 0) {
        const positiveData = positiveBehaviors.map((b) => ({
          behavior_id: generateUuidWithPrefix("behavior_"),
          class_id: classId,
          user_id: userId,
          name: b.name,
          point_value: b.point_value,
          description: b.description,
          icon: b.icon,
          color: b.color,
          title: b.title,
        }));

        await tx.insert(behaviors).values(positiveData);
      }

      if (negativeBehaviors.length > 0) {
        const negativeData = negativeBehaviors.map((b) => ({
          behavior_id: generateUuidWithPrefix("behavior_"),
          class_id: classId,
          user_id: userId,
          name: b.name,
          point_value: b.point_value,
          description: b.description,
          icon: b.icon,
          color: b.color,
          title: b.title,
        }));

        await tx.insert(behaviors).values(negativeData);
      }

      if (rewardItems.length > 0) {
        const rewardData = rewardItems.map((r) => ({
          item_id: generateUuidWithPrefix("item_"),
          class_id: classId,
          user_id: userId,
          price: r.price,
          name: r.name,
          description: r.description,
          icon: r.icon,
          type: r.type,
          title: r.title,
        }));

        await tx.insert(reward_items).values(rewardData);
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error importing behaviors and reward items:", error);
    throw new Error("Failed to import behaviors and reward items.");
  }
}
