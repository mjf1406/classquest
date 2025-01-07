"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"; // Adjust the import path based on your project structure
import { Button } from "~/components/ui/button"; // Assuming you have a Button component
import { Card } from "~/components/ui/card"; // Importing ShadCN's Card component
import { Check, Loader2 } from "lucide-react"; // Added Loader2 for spinner
import { FontAwesomeIconClient } from "~/components/FontAwesomeIconClient"; // Adjust the path as needed
import importBehaviorsAndRewardItems from "../actions/importData"; // Ensure this path is correct
import { useToast } from "~/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

// Define TypeScript interfaces for better type safety
interface BehaviorItem {
  behavior_id: string;
  name: string;
  point_value: number;
  description?: string;
  icon?: string;
  color?: string;
  title?: string;
}

interface RewardItem {
  item_id: string;
  name: string;
  description?: string;
  price: number;
  icon?: string;
  type: "solo" | "group" | "class";
  title?: string;
}

interface ImportFormProps {
  classes: {
    class_id: string;
    class_name: string;
  }[];
  behaviors: BehaviorItem[];
  rewardItems: RewardItem[];
}

const ImportForm: React.FC<ImportFormProps> = ({
  classes,
  behaviors,
  rewardItems,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const queryClient = useQueryClient();
  const [selectedPositiveBehaviorIds, setSelectedPositiveBehaviorIds] =
    useState<string[]>([]);
  const [selectedNegativeBehaviorIds, setSelectedNegativeBehaviorIds] =
    useState<string[]>([]);
  const [selectedRewardItemIds, setSelectedRewardItemIds] = useState<string[]>(
    [],
  );
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const selectedClass = classes.find((cls) => cls.class_id === selectedClassId);

  // Categorize behaviors
  const positiveBehaviorsList = behaviors.filter(
    (behavior) => behavior.point_value > 0,
  );
  const negativeBehaviorsList = behaviors.filter(
    (behavior) => behavior.point_value < 0,
  );

  // Helper to toggle a single item
  const toggleSelection = (
    id: string,
    selectedList: string[],
    setSelectedList: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    if (selectedList.includes(id)) {
      setSelectedList(selectedList.filter((itemId) => itemId !== id));
    } else {
      setSelectedList([...selectedList, id]);
    }
  };

  // Check if *all* items in a given list are selected
  const areAllSelected = (allIds: string[], selectedIds: string[]) =>
    allIds.length > 0 && allIds.length === selectedIds.length;

  // Derived booleans for toggling
  const isAllPositiveSelected = areAllSelected(
    positiveBehaviorsList.map((b) => b.behavior_id),
    selectedPositiveBehaviorIds,
  );
  const isAllNegativeSelected = areAllSelected(
    negativeBehaviorsList.map((b) => b.behavior_id),
    selectedNegativeBehaviorIds,
  );
  const isAllRewardsSelected = areAllSelected(
    rewardItems.map((item) => item.item_id),
    selectedRewardItemIds,
  );

  // "Select All" means everything is selected
  const isAllSelected =
    isAllPositiveSelected && isAllNegativeSelected && isAllRewardsSelected;

  // Handlers for toggling entire categories
  const toggleAllPositive = () => {
    if (isAllPositiveSelected) {
      setSelectedPositiveBehaviorIds([]);
    } else {
      setSelectedPositiveBehaviorIds(
        positiveBehaviorsList.map((b) => b.behavior_id),
      );
    }
  };

  const toggleAllNegative = () => {
    if (isAllNegativeSelected) {
      setSelectedNegativeBehaviorIds([]);
    } else {
      setSelectedNegativeBehaviorIds(
        negativeBehaviorsList.map((b) => b.behavior_id),
      );
    }
  };

  const toggleAllRewards = () => {
    if (isAllRewardsSelected) {
      setSelectedRewardItemIds([]);
    } else {
      setSelectedRewardItemIds(rewardItems.map((item) => item.item_id));
    }
  };

  const toggleAll = () => {
    if (isAllSelected) {
      // Unselect everything
      setSelectedPositiveBehaviorIds([]);
      setSelectedNegativeBehaviorIds([]);
      setSelectedRewardItemIds([]);
    } else {
      // Select everything
      setSelectedPositiveBehaviorIds(
        positiveBehaviorsList.map((b) => b.behavior_id),
      );
      setSelectedNegativeBehaviorIds(
        negativeBehaviorsList.map((b) => b.behavior_id),
      );
      setSelectedRewardItemIds(rewardItems.map((item) => item.item_id));
    }
  };

  /**
   * Server Action to handle form submission.
   * This function runs on the server and has access to server-side resources.
   */
  async function handleImport(
    formData: FormData,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // Extract data from FormData
      const classId = formData.get("classId") as string;

      // Parse JSON strings back to objects
      const positiveBehaviorsJson = formData.get("positiveBehaviors") as string;
      const negativeBehaviorsJson = formData.get("negativeBehaviors") as string;
      const rewardItemsJson = formData.get("rewardItems") as string;

      if (!classId) {
        return { success: false, message: "Class ID is required." };
      }

      // Deserialize JSON strings to objects with explicit types
      const positiveBehaviors: BehaviorItem[] = positiveBehaviorsJson
        ? (JSON.parse(positiveBehaviorsJson) as BehaviorItem[])
        : [];
      const negativeBehaviors: BehaviorItem[] = negativeBehaviorsJson
        ? (JSON.parse(negativeBehaviorsJson) as BehaviorItem[])
        : [];
      const rewardItemsToImport: RewardItem[] = rewardItemsJson
        ? (JSON.parse(rewardItemsJson) as RewardItem[])
        : [];

      // Prepare payload without userId (server obtains it via auth())
      const payload = {
        classId,
        positiveBehaviors: positiveBehaviors.map((b) => ({
          behavior_id: b.behavior_id,
          name: b.name,
          point_value: b.point_value,
          description: b.description,
          icon: b.icon,
          color: b.color,
          title: b.title,
        })),
        negativeBehaviors: negativeBehaviors.map((b) => ({
          behavior_id: b.behavior_id,
          name: b.name,
          point_value: b.point_value,
          description: b.description,
          icon: b.icon,
          color: b.color,
          title: b.title,
        })),
        rewardItems: rewardItemsToImport.map((r) => ({
          item_id: r.item_id,
          name: r.name,
          price: r.price,
          description: r.description,
          icon: r.icon,
          type: r.type,
          title: r.title,
        })),
      };

      // Call the server-side import function
      const result = await importBehaviorsAndRewardItems(payload);

      if (result.success) {
        return { success: true };
      } else {
        return { success: false, message: "Import failed." };
      }
    } catch (error: unknown) {
      console.error("Import Error:", error);
      if (error instanceof Error)
        return { success: false, message: error.message };
      else return { success: false, message: "Internal Server Error" };
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Create a FormData object from the form
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Serialize selected behaviors and reward items as JSON
    formData.set(
      "positiveBehaviors",
      JSON.stringify(
        positiveBehaviorsList.filter((b) =>
          selectedPositiveBehaviorIds.includes(b.behavior_id),
        ),
      ),
    );
    formData.set(
      "negativeBehaviors",
      JSON.stringify(
        negativeBehaviorsList.filter((b) =>
          selectedNegativeBehaviorIds.includes(b.behavior_id),
        ),
      ),
    );
    formData.set(
      "rewardItems",
      JSON.stringify(
        rewardItems.filter((item) =>
          selectedRewardItemIds.includes(item.item_id),
        ),
      ),
    );

    startTransition(async () => {
      const response = await handleImport(formData);

      if (response.success) {
        toast({
          title: "Import successful!",
          description:
            "The selected behaviors and/or reward items were imported successfully.",
          variant: "default",
        });
        await queryClient.refetchQueries({ queryKey: ["classes"] });
        await queryClient.invalidateQueries({ queryKey: ["classes"] });
        router.push(`/classes/${selectedClassId}`); // Redirect to a success page
      } else {
        toast({
          title: "Import failed!",
          description: response.message,
          variant: "destructive",
        });
      }
    });
  };

  // Determine if the submit button should be disabled
  const isSubmitDisabled =
    (selectedPositiveBehaviorIds.length === 0 &&
      selectedNegativeBehaviorIds.length === 0 &&
      selectedRewardItemIds.length === 0) ||
    isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Class Selection */}
      <div>
        <h3 className="mb-2 text-2xl font-semibold text-foreground">
          Select Class to Import Into
        </h3>
        <Select
          name="classId"
          onValueChange={(value) => setSelectedClassId(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((cls) => (
              <SelectItem key={cls.class_id} value={cls.class_id}>
                {cls.class_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Display Selected Class Information */}
      {selectedClass ? (
        <div className="rounded-lg bg-card p-4 text-foreground">
          <h2 className="text-lg font-semibold">
            Importing into Class: {selectedClass.class_name}
          </h2>
        </div>
      ) : (
        <div className="rounded-lg bg-gray-100 p-4">
          <p className="text-sm text-gray-600">No class selected.</p>
        </div>
      )}
      <div className="text-muted-foreground">
        Click cards to select the ones you want. If you want to import
        everything straight away, scroll to the bottom.
      </div>

      {/* Hidden Inputs to Pass Selected Objects as JSON */}
      <input
        type="hidden"
        name="positiveBehaviors"
        value={JSON.stringify(
          positiveBehaviorsList.filter((b) =>
            selectedPositiveBehaviorIds.includes(b.behavior_id),
          ),
        )}
      />
      <input
        type="hidden"
        name="negativeBehaviors"
        value={JSON.stringify(
          negativeBehaviorsList.filter((b) =>
            selectedNegativeBehaviorIds.includes(b.behavior_id),
          ),
        )}
      />
      <input
        type="hidden"
        name="rewardItems"
        value={JSON.stringify(
          rewardItems.filter((item) =>
            selectedRewardItemIds.includes(item.item_id),
          ),
        )}
      />

      {/* Positive Behaviors */}
      <div>
        <h3 className="mb-2 text-2xl font-semibold text-foreground">
          Positive Behaviors
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {positiveBehaviorsList.map((behavior) => (
            <Card
              key={behavior.behavior_id}
              onClick={() =>
                toggleSelection(
                  behavior.behavior_id,
                  selectedPositiveBehaviorIds,
                  setSelectedPositiveBehaviorIds,
                )
              }
              className={`cursor-pointer border p-4 ${
                selectedPositiveBehaviorIds.includes(behavior.behavior_id)
                  ? "border-blue-500 shadow-lg"
                  : "border-gray-300"
              } flex items-center space-x-2 rounded-lg transition-colors`}
            >
              <FontAwesomeIconClient
                icon={behavior.icon}
                size={24}
                className="h-6 w-6"
              />
              <div>
                <p className="font-medium">
                  {behavior.name} ({behavior.point_value})
                </p>
                {behavior.description && (
                  <p className="text-sm text-gray-500">
                    {behavior.description}
                  </p>
                )}
              </div>
              {selectedPositiveBehaviorIds.includes(behavior.behavior_id) && (
                <Check className="ml-auto text-blue-500" />
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Negative Behaviors */}
      <div>
        <h3 className="mb-2 text-2xl font-semibold text-foreground">
          Negative Behaviors
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {negativeBehaviorsList.map((behavior) => (
            <Card
              key={behavior.behavior_id}
              onClick={() =>
                toggleSelection(
                  behavior.behavior_id,
                  selectedNegativeBehaviorIds,
                  setSelectedNegativeBehaviorIds,
                )
              }
              className={`cursor-pointer border p-4 ${
                selectedNegativeBehaviorIds.includes(behavior.behavior_id)
                  ? "border-red-500 shadow-lg"
                  : "border-gray-300"
              } flex items-center space-x-2 rounded-lg transition-colors`}
            >
              <FontAwesomeIconClient
                icon={behavior.icon}
                size={24}
                className="h-6 w-6"
              />
              <div>
                <p className="font-medium">
                  {behavior.name} ({behavior.point_value})
                </p>
                {behavior.description && (
                  <p className="text-sm text-gray-500">
                    {behavior.description}
                  </p>
                )}
              </div>
              {selectedNegativeBehaviorIds.includes(behavior.behavior_id) && (
                <Check className="ml-auto text-red-500" />
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Reward Items */}
      <div>
        <h3 className="mb-2 text-2xl font-semibold text-foreground">
          Reward Items
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {rewardItems.map((item) => (
            <Card
              key={item.item_id}
              onClick={() =>
                toggleSelection(
                  item.item_id,
                  selectedRewardItemIds,
                  setSelectedRewardItemIds,
                )
              }
              className={`cursor-pointer border p-4 ${
                selectedRewardItemIds.includes(item.item_id)
                  ? "border-green-500 shadow-lg"
                  : "border-gray-300"
              } flex items-center space-x-2 rounded-lg transition-colors`}
            >
              <FontAwesomeIconClient
                icon={item.icon}
                size={24}
                className="h-6 w-6"
              />
              <div>
                <p className="font-medium">
                  {item.name} ({item.price})
                </p>
                {item.description && (
                  <p className="text-sm text-gray-500">{item.description}</p>
                )}
              </div>
              {selectedRewardItemIds.includes(item.item_id) && (
                <Check className="ml-auto text-green-500" />
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* 
        -------------------------------------------------------------
        TOGGLING BUTTONS
        -------------------------------------------------------------
      */}
      <div className="flex flex-col items-stretch space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
        {/* Select All / Unselect All */}
        <Button
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            toggleAll();
          }}
        >
          {isAllSelected ? "Unselect All" : "Select All"}
        </Button>

        {/* Select/Unselect All Positive Behaviors */}
        <Button
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            toggleAllPositive();
          }}
        >
          {isAllPositiveSelected
            ? "Unselect All Positive"
            : "Select All Positive"}
        </Button>

        {/* Select/Unselect All Negative Behaviors */}
        <Button
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            toggleAllNegative();
          }}
        >
          {isAllNegativeSelected
            ? "Unselect All Negative"
            : "Select All Negative"}
        </Button>

        {/* Select/Unselect All Reward Items */}
        <Button
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            toggleAllRewards();
          }}
        >
          {isAllRewardsSelected ? "Unselect All Rewards" : "Select All Rewards"}
        </Button>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitDisabled}
        className="mt-4 flex w-full items-center justify-center"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit"
        )}
      </Button>
    </form>
  );
};

export default ImportForm;
