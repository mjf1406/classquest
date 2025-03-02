"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { useToast } from "~/components/ui/use-toast";
import { Label } from "~/components/ui/label";
import { updateExpectation } from "../actions/updateExpectation";
import { deleteExpectation } from "../actions/deleteExpectation";
import type { Expectation, TeacherCourse } from "~/server/db/types";

interface EditExpectationDialogProps {
  classId: string;
  expectation: Expectation;
  onClose: () => void;
}

type MutationContext = {
  previousClasses?: TeacherCourse[];
};

interface UpdateExpectationResponse {
  success: boolean;
}

interface DeleteExpectationResponse {
  success: boolean;
}

export default function EditExpectationDialog({
  classId,
  expectation,
  onClose,
}: EditExpectationDialogProps) {
  const [open, setOpen] = useState(true);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [name, setName] = useState(expectation.name);
  const [description, setDescription] = useState(expectation.description);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateExpectationMutation = useMutation<
    UpdateExpectationResponse,
    unknown,
    {
      classId: string;
      expectationId: string;
      name: string;
      description: string;
    },
    MutationContext
  >({
    mutationFn: async (data) => {
      const result = await updateExpectation(data);
      if (!result?.success) {
        throw new Error("Failed to update expectation");
      }
      return result as UpdateExpectationResponse;
    },
    onMutate: async (updatedData) => {
      await queryClient.cancelQueries({ queryKey: ["classes"] });
      const previousClasses = queryClient.getQueryData<TeacherCourse[]>([
        "classes",
      ]);
      queryClient.setQueryData<TeacherCourse[]>(["classes"], (old = []) => {
        return old.map((course) => {
          if (course.class_id === classId) {
            return {
              ...course,
              expectations: course.expectations?.map((exp) =>
                exp.id === expectation.id
                  ? {
                      ...exp,
                      name: updatedData.name,
                      description: updatedData.description,
                      updated_date: new Date().toISOString(),
                    }
                  : exp,
              ),
            };
          }
          return course;
        });
      });
      return { previousClasses };
    },
    onError: (error, _variables, context) => {
      if (context?.previousClasses) {
        queryClient.setQueryData(["classes"], context.previousClasses);
      }
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expectation updated successfully!",
      });
      setOpen(false);
      onClose();
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });

  const deleteExpectationMutation = useMutation<
    DeleteExpectationResponse,
    Error, // Explicitly type the error as Error instead of unknown
    void,
    MutationContext
  >({
    mutationFn: async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const result: unknown = await deleteExpectation({
          expectationId: expectation.id,
        });
        // Assert the type of result
        const typedResult = result as { success?: boolean };

        if (!typedResult?.success) {
          throw new Error("Failed to delete expectation");
        }
        return typedResult as DeleteExpectationResponse;
      } catch (err) {
        throw err instanceof Error
          ? err
          : new Error("An unexpected error occurred");
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["classes"] });
      const previousClasses = queryClient.getQueryData<TeacherCourse[]>([
        "classes",
      ]);
      queryClient.setQueryData<TeacherCourse[]>(["classes"], (old = []) => {
        return old.map((course) => {
          if (course.class_id === classId) {
            return {
              ...course,
              expectations: course.expectations?.filter(
                (exp) => exp.id !== expectation.id,
              ),
            };
          }
          return course;
        });
      });
      return { previousClasses };
    },
    onError: (error, _variables, context) => {
      if (context?.previousClasses) {
        queryClient.setQueryData(["classes"], context.previousClasses);
      }
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expectation deleted successfully!",
      });
      setOpen(false);
      onClose();
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description?.trim()) {
      toast({
        title: "Error",
        description: "Name and description are required",
        variant: "destructive",
      });
      return;
    }
    updateExpectationMutation.mutate({
      classId,
      expectationId: expectation.id,
      name: name.trim(),
      description: description.trim(),
    });
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(openVal) => {
          if (!openVal) {
            setOpen(false);
            onClose();
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Expectation</DialogTitle>
              <DialogDescription>
                Update the name and description for the expectation.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Name*
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="A short, memorable name"
                  required
                  disabled={
                    updateExpectationMutation.isPending ||
                    deleteExpectationMutation.isPending
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description*
                </Label>
                <Textarea
                  id="description"
                  value={description ?? ""}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="An explanation of the expectation in student-friendly language"
                  required
                  disabled={
                    updateExpectationMutation.isPending ||
                    deleteExpectationMutation.isPending
                  }
                />
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setConfirmDeleteOpen(true)}
                  disabled={
                    updateExpectationMutation.isPending ||
                    deleteExpectationMutation.isPending
                  }
                >
                  {deleteExpectationMutation.isPending
                    ? "Deleting..."
                    : "Delete"}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setOpen(false);
                    onClose();
                  }}
                  disabled={
                    updateExpectationMutation.isPending ||
                    deleteExpectationMutation.isPending
                  }
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    updateExpectationMutation.isPending ||
                    deleteExpectationMutation.isPending
                  }
                >
                  {updateExpectationMutation.isPending
                    ? "Updating..."
                    : "Update"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Delete */}
      <Dialog
        open={confirmDeleteOpen}
        onOpenChange={(openVal) => {
          if (!openVal) setConfirmDeleteOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expectation? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setConfirmDeleteOpen(false)}
              disabled={deleteExpectationMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteExpectationMutation.mutate();
                setConfirmDeleteOpen(false);
              }}
              disabled={deleteExpectationMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
