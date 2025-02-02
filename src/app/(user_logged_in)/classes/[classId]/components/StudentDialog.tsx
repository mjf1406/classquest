// StudentDialog.tsx

import React, { useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer";
import { Button } from "~/components/ui/button";
import {
  useSuspenseQuery,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import { classesOptions } from "~/app/api/queryOptions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import BehaviorsGrid from "./BehaviorsGrid";
import CreateBehaviorDialog from "./CreateBehaviorDialog";
import {
  addDefaultBehaviors,
  applyBehavior,
  createBehavior,
} from "../behaviorActions";
import { z } from "zod";
import type { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core";
import { useToast } from "~/components/ui/use-toast";
import useIsMobile from "~/app/(user_logged_in)/hooks";
import NumberInput from "~/components/ui/NumberInput";
import type { Behavior, RewardItem, TeacherCourse } from "~/server/db/types";
import CreateRewardItemDialog, {
  type RewardItemData,
} from "~/app/(user_logged_in)/tools/points/components/CreateRewardItemDialog";
import {
  createRewardItem,
  applyRewardItem,
  addDefaultRewardItems,
} from "../rewardItemActions";
import RewardItemsGrid from "./RewardItemsGrid";
import CustomDialogContent from "~/components/CustomDialogContent";
import { LayoutDashboard } from "lucide-react";
import Link from "next/link";

interface StudentDialogProps {
  studentId: string;
  classId: string;
  onClose: () => void;
}

const behaviorFormSchema = z.object({
  name: z.string().nonempty("Name is required"),
  title: z.string().optional().nullable(),
  point_value: z.preprocess(
    (val) => parseInt(val as string, 10),
    z.number().int(),
  ),
  description: z.string().optional(),
  icon: z
    .object({
      name: z.custom<IconName>(),
      prefix: z.custom<IconPrefix>(),
    })
    .nullable(),
  color: z.string(),
  class_id: z.string().optional(),
  achievements: z
    .array(
      z.object({
        threshold: z
          .number()
          .int()
          .nonnegative("Threshold must be a non-negative integer"),
        name: z.string().nonempty("Achievement name is required"),
      }),
    )
    .optional(),
});

export type BehaviorData = z.infer<typeof behaviorFormSchema>;

// Define a type for the expected result from applyBehavior
interface ApplyBehaviorResult {
  success: boolean;
  message?: string;
}

// Define the context type for our mutation so that we can safely access previousClasses.
interface MutationContext {
  previousClasses: TeacherCourse[] | undefined;
}

const StudentDialog: React.FC<StudentDialogProps> = ({
  studentId,
  classId,
  onClose,
}) => {
  console.log("🚀 ~ studentId:", studentId);
  const queryClient = useQueryClient();
  const [isCreateBehaviorDialogOpen, setIsCreateBehaviorDialogOpen] =
    useState(false);
  const [isCreateRewardItemDialogOpen, setIsCreateRewardItemDialogOpen] =
    useState(false);
  const { toast } = useToast();
  const { data: coursesData = [] } = useSuspenseQuery(classesOptions);
  const courseData = coursesData.find((course) => course.class_id === classId);
  const studentData = courseData?.students?.find(
    (student) => student.student_id === studentId,
  );

  // Categorize behaviors based on point_value
  const positiveBehaviors = courseData?.behaviors?.filter(
    (behavior) => behavior.point_value > 0,
  ) as Behavior[];
  const negativeBehaviors = courseData?.behaviors?.filter(
    (behavior) => behavior.point_value < 0,
  ) as Behavior[];
  const rewardItems = courseData?.reward_items as RewardItem[];

  const negativePoints =
    studentData?.point_history
      ?.filter((record) => record.type === "negative")
      .reduce((sum, record) => sum + record.number_of_points, 0) ?? 0;

  const positivePoints =
    studentData?.point_history
      ?.filter((record) => record.type === "positive")
      .reduce((sum, record) => sum + record.number_of_points, 0) ?? 0;

  const redemptionSum =
    studentData?.redemption_history.reduce(
      (sum, record) => sum + record.quantity,
      0,
    ) ?? 0;

  const [inputQuantity, setInputQuantity] = useState<number>(1);

  // Optimistic update mutation for applying a behavior.
  const applyBehaviorMutation = useMutation<
    ApplyBehaviorResult,
    unknown,
    { behavior_id: string; inputQuantity: number },
    MutationContext
  >({
    mutationFn: async (payload) => {
      return await applyBehavior(
        payload.behavior_id,
        [studentData!],
        classId,
        payload.inputQuantity,
      );
    },
    onMutate: async (payload) => {
      const behavior = courseData?.behaviors?.find(
        (b) => b.behavior_id === payload.behavior_id,
      );
      if (!behavior) return { previousClasses: undefined };
      await queryClient.cancelQueries({ queryKey: ["classes"] });
      const previousClasses = queryClient.getQueryData<TeacherCourse[]>([
        "classes",
      ]);
      queryClient.setQueryData<TeacherCourse[]>(["classes"], (oldClasses) => {
        if (!oldClasses) return oldClasses;
        return oldClasses.map((course) => {
          if (course.class_id !== classId) return course;
          if (course.students) {
            const updatedStudents = course.students.map((student) => {
              if (student.student_id === studentId) {
                return {
                  ...student,
                  points:
                    (student.points ?? 0) +
                    behavior.point_value * payload.inputQuantity,
                };
              }
              return student;
            });
            return { ...course, students: updatedStudents };
          }
          return course;
        });
      });
      return { previousClasses };
    },
    onError: (_error, _payload, context) => {
      if (context?.previousClasses) {
        queryClient.setQueryData(["classes"], context.previousClasses);
      }
      toast({
        title: "Error",
        description: "Failed to apply behavior. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: (data, _payload) => {
      if (data.success) {
        toast({
          title: "Success",
          description: "Behavior applied successfully.",
        });
        onClose();
      } else {
        toast({
          title: "Error",
          description:
            data.message ?? "Failed to apply behavior. Please try again.",
          variant: "destructive",
        });
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries(classesOptions);
    },
  });

  // Immediately call the mutation without setting a temporary loading state.
  const handleBehaviorSelect = async (behavior_id: string): Promise<void> => {
    onClose();
    applyBehaviorMutation.mutate({ behavior_id, inputQuantity });
  };

  const handleCreateBehavior = async (
    newBehavior: BehaviorData,
  ): Promise<void> => {
    try {
      const result = await createBehavior(newBehavior);
      if (result.success) {
        await queryClient.invalidateQueries(classesOptions);
        setIsCreateBehaviorDialogOpen(false);
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        console.error("Error creating behavior:", result.message);
        toast({
          title: "Error",
          description: `Failed to create behavior: ${result.message}! Please try again.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating behavior:", error);
      toast({
        title: "Error",
        description: `An unexpected error occurred while creating the behavior. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleCreateRewardItem = async (
    rewardItem: RewardItemData,
  ): Promise<void> => {
    try {
      const rewardItemData = {
        ...rewardItem,
        title: rewardItem.title ?? undefined,
        achievements: rewardItem.achievements ?? [],
      };
      const result = await createRewardItem(rewardItemData);
      if (result.success) {
        await queryClient.invalidateQueries(classesOptions);
        setIsCreateRewardItemDialogOpen(false);
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        console.error("Error creating reward item:", result.message);
        toast({
          title: "Error",
          description: `Failed to create reward item: ${result.message}! Please try again.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating reward item:", error);
      toast({
        title: "Error",
        description: `An unexpected error occurred while creating the reward item. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleRewardItemSelect = async (item_id: string): Promise<void> => {
    onClose();
    applyRewardItemMutation.mutate({ item_id, inputQuantity });
  };

  // Mutation for applying a reward item with optimistic updates.
  const applyRewardItemMutation = useMutation<
    ApplyBehaviorResult,
    unknown,
    { item_id: string; inputQuantity: number },
    MutationContext
  >({
    mutationFn: async (payload) => {
      return await applyRewardItem(
        payload.item_id,
        [studentData!],
        classId,
        payload.inputQuantity,
      );
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["classes"] });
      const previousClasses = queryClient.getQueryData<TeacherCourse[]>([
        "classes",
      ]);
      return { previousClasses };
    },
    onError: (_error, _payload, context) => {
      if (context?.previousClasses) {
        queryClient.setQueryData(["classes"], context.previousClasses);
      }
      toast({
        title: "Error",
        description: "Failed to redeem reward item. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: (data, _payload) => {
      if (data.success) {
        toast({
          title: "Success",
          description: "Reward item redeemed successfully.",
        });
        onClose();
      } else {
        toast({
          title: "Error",
          description:
            data.message ?? "Failed to redeem reward item. Please try again.",
          variant: "destructive",
        });
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries(classesOptions);
    },
  });

  const isMobile = useIsMobile();

  const refreshBehaviors = () => {
    void queryClient.invalidateQueries(classesOptions);
  };

  const refreshRewardItems = () => {
    void queryClient.invalidateQueries(classesOptions);
  };

  const mainContent = (
    <>
      <div className="absolute left-1 top-1 text-xl">
        #{studentData?.student_number}
      </div>
      <div className="m-auto flex w-full flex-col items-center justify-center gap-5">
        <div className="text-2xl">
          <FontAwesomeIcon
            icon={["fas", "trophy"]}
            className="mr-2 text-yellow-500"
          />
          {studentData?.points ?? 0}
        </div>
        <div className="flex gap-16">
          <div>
            <FontAwesomeIcon
              icon={["fas", "award"]}
              className="mr-2 text-green-600"
            />
            {positivePoints}
          </div>
          <div>
            <FontAwesomeIcon
              icon={["fas", "flag"]}
              className="mr-2 text-red-500"
            />
            {negativePoints}
          </div>
          <div>
            <FontAwesomeIcon
              icon={["fas", "gift"]}
              className="mr-2 text-blue-500"
            />
            {redemptionSum}
          </div>
        </div>
        <Tabs
          defaultValue="award"
          className="m-auto flex w-full flex-col items-center justify-center"
        >
          <TabsList className="bg-foreground/20">
            <TabsTrigger value="award">
              <FontAwesomeIcon icon={["fas", "award"]} className="mr-2" />
              Award Points
            </TabsTrigger>
            <TabsTrigger value="remove">
              <FontAwesomeIcon icon={["fas", "flag"]} className="mr-2" /> Remove
              Points
            </TabsTrigger>
            <TabsTrigger value="redeem">
              <FontAwesomeIcon icon={["fas", "gift"]} className="mr-2" /> Redeem
              Points
            </TabsTrigger>
          </TabsList>
          <TabsContent value="award">
            {positiveBehaviors && positiveBehaviors.length > 0 ? (
              <div className="flex flex-col items-center justify-center gap-5">
                {courseData?.role === "primary" && (
                  <div className="flex gap-2">
                    <Button onClick={() => setIsCreateBehaviorDialogOpen(true)}>
                      Create Behavior
                    </Button>
                    <Button
                      variant={"outline"}
                      onClick={() => {
                        void addDefaultBehaviors(classId);
                        window.location.reload();
                      }}
                    >
                      Add Default Behaviors
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span>Quantity</span>
                  <NumberInput
                    value={inputQuantity}
                    onChange={setInputQuantity}
                    min={1}
                    step={1}
                    name="inputQuantity"
                    id="inputQuantity"
                  />
                </div>
                <BehaviorsGrid
                  behaviors={positiveBehaviors}
                  onBehaviorSelect={handleBehaviorSelect}
                  refreshBehaviors={refreshBehaviors}
                  role={courseData?.role ?? "primary"}
                  loadingBehaviorId={""}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-5">
                {courseData?.role === "primary" && (
                  <div className="flex gap-2">
                    <Button onClick={() => setIsCreateBehaviorDialogOpen(true)}>
                      Create Behavior
                    </Button>
                    <Button
                      variant={"outline"}
                      onClick={() => {
                        void addDefaultBehaviors(classId);
                        window.location.reload();
                      }}
                    >
                      Add Default Behaviors
                    </Button>
                  </div>
                )}
                <p>No positive behaviors created yet.</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="remove">
            {negativeBehaviors && negativeBehaviors.length > 0 ? (
              <div className="flex flex-col items-center justify-center gap-5">
                {courseData?.role === "primary" && (
                  <div className="flex gap-2">
                    <Button onClick={() => setIsCreateBehaviorDialogOpen(true)}>
                      Create Behavior
                    </Button>
                    <Button
                      variant={"outline"}
                      onClick={() => {
                        void addDefaultBehaviors(classId);
                        window.location.reload();
                      }}
                    >
                      Add Default Behaviors
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span>Quantity</span>
                  <NumberInput
                    value={inputQuantity}
                    onChange={setInputQuantity}
                    min={1}
                    max={10}
                    step={1}
                    name="inputQuantity"
                    id="inputQuantity"
                  />
                </div>
                <BehaviorsGrid
                  behaviors={negativeBehaviors}
                  onBehaviorSelect={handleBehaviorSelect}
                  refreshBehaviors={refreshBehaviors}
                  role={courseData?.role ?? "primary"}
                  loadingBehaviorId={""}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-5">
                {courseData?.role === "primary" && (
                  <div className="flex gap-2">
                    <Button onClick={() => setIsCreateBehaviorDialogOpen(true)}>
                      Create Behavior
                    </Button>
                    <Button
                      variant={"outline"}
                      onClick={() => {
                        void addDefaultBehaviors(classId);
                        window.location.reload();
                      }}
                    >
                      Add Default Behaviors
                    </Button>
                  </div>
                )}
                <p>No negative behaviors created yet.</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="redeem">
            {rewardItems && rewardItems.length > 0 ? (
              <div className="flex flex-col items-center justify-center gap-5">
                {courseData?.role === "primary" && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIsCreateRewardItemDialogOpen(true)}
                    >
                      Create Reward Item
                    </Button>
                    <Button
                      variant={"outline"}
                      onClick={() => {
                        void addDefaultRewardItems(classId);
                        window.location.reload();
                      }}
                    >
                      Add Default Rewards
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span>Quantity</span>
                  <NumberInput
                    value={inputQuantity}
                    onChange={setInputQuantity}
                    min={1}
                    max={10}
                    step={1}
                    name="inputQuantity"
                    id="inputQuantity"
                  />
                </div>
                <RewardItemsGrid
                  rewardItems={rewardItems}
                  onRewardItemSelect={handleRewardItemSelect}
                  refreshRewardItems={refreshRewardItems}
                  role={courseData?.role ?? "primary"}
                  loadingItemId={""}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-5">
                {courseData?.role === "primary" && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIsCreateRewardItemDialogOpen(true)}
                    >
                      Create Reward Item
                    </Button>
                    <Button
                      variant={"outline"}
                      onClick={() => {
                        void addDefaultRewardItems(classId);
                        window.location.reload();
                      }}
                    >
                      Add Default Rewards
                    </Button>
                  </div>
                )}
                <p>No reward items created yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );

  return (
    <>
      {useIsMobile() ? (
        <Drawer
          open
          onOpenChange={(open) => {
            if (!open) onClose();
          }}
        >
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="mt-5 text-center text-2xl">
                <div>
                  {studentData?.student_name_first_en}{" "}
                  {studentData?.student_name_last_en}
                </div>
                <Button asChild variant={"outline"}>
                  <Link
                    key={studentData?.student_id}
                    href={`/classes/${courseData?.class_id}/dashboard/${studentData?.student_id}`}
                  >
                    <LayoutDashboard className="mr-2 h-3 w-3 md:h-5 md:w-5" />{" "}
                    {studentData?.student_name_first_en}{" "}
                    {studentData?.student_name_last_en} Dashboard
                  </Link>
                </Button>
              </DrawerTitle>
              <DrawerDescription className="text-center">
                Award and remove points based on student behaviors.
              </DrawerDescription>
            </DrawerHeader>
            {mainContent}
            <DrawerFooter>
              <Button onClick={onClose}>Close</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) onClose();
          }}
        >
          <CustomDialogContent className="w-full rounded-xl sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-5xl 2xl:max-w-6xl">
            <DialogHeader>
              <DialogTitle className="mt-5 text-center text-2xl">
                <div>
                  {studentData?.student_name_first_en}{" "}
                  {studentData?.student_name_last_en}
                </div>
                <Button asChild variant={"outline"}>
                  <Link
                    key={studentData?.student_id}
                    href={`/classes/${courseData?.class_id}/dashboard/${studentData?.student_id}`}
                  >
                    <LayoutDashboard className="mr-2 h-3 w-3 md:h-5 md:w-5" />{" "}
                    {studentData?.student_name_first_en}{" "}
                    {studentData?.student_name_last_en} Dashboard
                  </Link>
                </Button>
              </DialogTitle>
              <DialogDescription className="text-center">
                Award and remove points based on student behaviors.
              </DialogDescription>
            </DialogHeader>
            {mainContent}
            <DialogFooter>
              <Button onClick={onClose}>Close</Button>
            </DialogFooter>
          </CustomDialogContent>
        </Dialog>
      )}
      {courseData?.role === "primary" && isCreateBehaviorDialogOpen && (
        <CreateBehaviorDialog
          open={isCreateBehaviorDialogOpen}
          onClose={() => setIsCreateBehaviorDialogOpen(false)}
          onCreateBehavior={handleCreateBehavior}
          classId={classId}
        />
      )}
      {courseData?.role === "primary" && isCreateRewardItemDialogOpen && (
        <CreateRewardItemDialog
          open={isCreateRewardItemDialogOpen}
          onClose={() => setIsCreateRewardItemDialogOpen(false)}
          onCreateRewardItem={handleCreateRewardItem}
          classId={classId}
        />
      )}
    </>
  );
};

export default StudentDialog;
