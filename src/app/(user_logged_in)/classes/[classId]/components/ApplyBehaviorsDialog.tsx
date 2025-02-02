// ApplyBehaviorDialog.tsx

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
import type { StudentData } from "~/app/api/getClassesGroupsStudents/route";
import NumberInput from "~/components/ui/NumberInput";
import type { Behavior, RewardItem, TeacherCourse } from "~/server/db/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CreateRewardItemDialog, {
  type RewardItemData,
} from "~/app/(user_logged_in)/tools/points/components/CreateRewardItemDialog";
import {
  addDefaultRewardItems,
  applyRewardItem,
  createRewardItem,
} from "../rewardItemActions";
import RewardItemsGrid from "./RewardItemsGrid";
import CustomDialogContent from "~/components/CustomDialogContent";

interface ApplyBehaviorDialogProps {
  selectedStudents: StudentData[];
  classId: string;
  onClose: () => void;
}

const behaviorFormSchema = z.object({
  name: z.string().nonempty("Name is required"),
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
});

export type BehaviorData = z.infer<typeof behaviorFormSchema>;

// Define an interface for the expected result from applying an action.
interface ApplyActionResult {
  success: boolean;
  message?: string;
}

// Define the context type for our mutation so we can safely access previousClasses.
interface MutationContext {
  previousClasses: TeacherCourse[] | undefined;
}

const ApplyBehaviorDialog: React.FC<ApplyBehaviorDialogProps> = ({
  selectedStudents,
  classId,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [isCreateBehaviorDialogOpen, setIsCreateBehaviorDialogOpen] =
    useState(false);
  const [isCreateRewardItemDialogOpen, setIsCreateRewardItemDialogOpen] =
    useState(false);
  const { toast } = useToast();
  const { data: coursesData = [] } = useSuspenseQuery(classesOptions);
  const courseData = coursesData.find((course) => course.class_id === classId);

  const positiveBehaviors = courseData?.behaviors?.filter(
    (behavior) => behavior.point_value >= 1,
  ) as Behavior[];
  const negativeBehaviors = courseData?.behaviors?.filter(
    (behavior) => behavior.point_value <= -1,
  ) as Behavior[];
  const rewardItems = courseData?.reward_items as RewardItem[];

  const [inputQuantity, setInputQuantity] = useState<number>(1);

  // Mutation for applying a behavior with optimistic updates.
  const applyBehaviorMutation = useMutation<
    ApplyActionResult,
    unknown,
    { behavior_id: string; inputQuantity: number },
    MutationContext
  >({
    mutationFn: async (payload) => {
      return await applyBehavior(
        payload.behavior_id,
        selectedStudents,
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
              if (
                selectedStudents.some(
                  (s) => s.student_id === student.student_id,
                )
              ) {
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
          description:
            "Behavior applied successfully to all selected students.",
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

  // Mutation for applying a reward item with optimistic updates.
  const applyRewardItemMutation = useMutation<
    ApplyActionResult,
    unknown,
    { item_id: string; inputQuantity: number },
    MutationContext
  >({
    mutationFn: async (payload) => {
      return await applyRewardItem(
        payload.item_id,
        selectedStudents,
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
          description:
            "Reward item redeemed successfully for all selected students.",
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

  // These handlers now simply call the corresponding mutation.
  const handleBehaviorSelect = async (behavior_id: string): Promise<void> => {
    onClose();
    applyBehaviorMutation.mutate({ behavior_id, inputQuantity });
  };

  const handleRewardItemSelect = async (item_id: string): Promise<void> => {
    onClose();
    applyRewardItemMutation.mutate({ item_id, inputQuantity });
  };

  // Define missing functions for creating behaviors and reward items.
  const handleCreateBehavior = async (
    newBehavior: BehaviorData,
  ): Promise<void> => {
    try {
      const result = await createBehavior(newBehavior);
      if (result.success) {
        await queryClient.invalidateQueries(classesOptions);
        setIsCreateBehaviorDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: `Failed to create behavior: ${result.message}! Please try again.`,
          variant: "destructive",
        });
      }
    } catch (error) {
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
      const newRewardItem: RewardItemData = {
        name: rewardItem.name,
        title: rewardItem.title ?? undefined,
        price: rewardItem.price,
        description: rewardItem.description ?? null,
        icon: rewardItem.icon ? rewardItem.icon : "fas circle-question",
        type: rewardItem.type,
        class_id: classId,
        achievements: rewardItem.achievements ?? null,
      };
      const result = await createRewardItem(newRewardItem);
      if (result.success) {
        await queryClient.invalidateQueries(classesOptions);
        setIsCreateRewardItemDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: `Failed to create reward item: ${result.message}! Please try again.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `An unexpected error occurred while creating the reward item. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const isMobile = useIsMobile();

  const refreshBehaviors = () => {
    void queryClient.invalidateQueries(classesOptions);
  };

  const refreshRewardItems = () => {
    void queryClient.invalidateQueries(classesOptions);
  };

  // Sort selected students alphabetically by first name.
  const sortedSelectedStudents = [...selectedStudents].sort((a, b) =>
    a.student_name_first_en.localeCompare(b.student_name_first_en),
  );

  const mainContent = (
    <>
      <div className="mb-4 pl-4 pr-4">
        <h3 className="text-base font-semibold">Selected Students:</h3>
        <div className="grid grid-cols-4 overflow-x-clip text-xs md:text-sm">
          {sortedSelectedStudents.map((student) => (
            <div className="col-span-1" key={student.student_id}>
              {student.student_name_first_en}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-5">
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
      {isMobile ? (
        <Drawer open onOpenChange={(open) => !open && onClose()}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="mt-5 text-center text-2xl">
                Apply Action to {sortedSelectedStudents.length} Student(s)
              </DrawerTitle>
              <DrawerDescription className="text-center">
                Award, remove, or redeem points based on student behaviors.
              </DrawerDescription>
            </DrawerHeader>
            {mainContent}
            <DrawerFooter>
              <Button onClick={onClose}>Close</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open onOpenChange={() => onClose()}>
          <CustomDialogContent className="w-full rounded-xl sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-5xl 2xl:max-w-6xl">
            <DialogHeader>
              <DialogTitle className="mt-5 text-center text-2xl">
                Apply Action to {sortedSelectedStudents.length} Student(s)
              </DialogTitle>
              <DialogDescription className="text-center">
                Award, remove, or redeem points based on student behaviors.
              </DialogDescription>
            </DialogHeader>
            {mainContent}
            <DialogFooter>
              <Button onClick={onClose}>Close</Button>
            </DialogFooter>
          </CustomDialogContent>
        </Dialog>
      )}
      {isCreateBehaviorDialogOpen && (
        <CreateBehaviorDialog
          open={isCreateBehaviorDialogOpen}
          onClose={() => setIsCreateBehaviorDialogOpen(false)}
          onCreateBehavior={handleCreateBehavior}
          classId={classId}
        />
      )}
      {isCreateRewardItemDialogOpen && (
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

export default ApplyBehaviorDialog;
