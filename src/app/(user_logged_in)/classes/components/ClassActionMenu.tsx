"use client";

import React, { useState, useTransition } from "react";
import { Button } from "~/components/ui/button";
import {
  MoreVertical,
  SquarePen,
  Trash2,
  Mail,
  Loader2,
  Copy,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useToast } from "~/components/ui/use-toast";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import removeClassFromTeacher from "~/server/actions/removeClassFromTeacher";
import { classesOptions } from "~/app/api/queryOptions"; // Ensure this exports the same query used in ClassList
import { sendEmails } from "~/server/actions/sendStudentDashboardEmails";
import { cn } from "~/lib/utils";
import ClassCodeDisplay from "./ClassCode";

interface ClassActionMenuProps {
  classId: string;
  className?: string;
}

const ClassActionMenu: React.FC<ClassActionMenuProps> = ({
  classId,
  className,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [courseToDelete, setCourseToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteCourseText, setDeleteCourseText] = useState("");
  const [isSendingEmails, startTransition] = useTransition();

  const { data: courses = [] } = useSuspenseQuery(classesOptions);
  const course = courses.find((c) => c.class_id === classId);

  if (!course) {
    return <div className="text-red-500">Error: Class not found.</div>;
  }

  // This mutation handles deleting the class
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const deleteMutation = useMutation({
    mutationFn: (classId: string) =>
      removeClassFromTeacher(classId, course.role),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast({
        title: "Class deleted successfully!",
        description: `The class "${course.class_name}" has been successfully deleted.`,
      });
      // Reset dialog state upon successful deletion
      setCourseToDelete(null);
      setDeleteCourseText("");
    },
    onError: () => {
      toast({
        title: "Failed to delete class!",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(
        `https://www.classquest.app/import?import_code=${course.class_code}`,
      )
      .then(
        () => {
          toast({
            title: "Copied!",
            description:
              "Class behavior/rewards share link has been copied to your clipboard.",
            variant: "default",
          });
        },
        (err) => {
          console.error("Could not copy text: ", err);
          toast({
            title: "Error",
            description: "Failed to copy class code.",
            variant: "destructive",
          });
        },
      );
  };

  const handleSendEmails = () => {
    startTransition(async () => {
      try {
        await sendEmails({ classId });
        toast({
          title: "Emails Sent!",
          description:
            "It can take up to several hours for the emails to arrive.",
        });
      } catch (error: unknown) {
        console.error("Error sending emails:", error);
        toast({
          title: "Failed to send emails!",
          description:
            error instanceof Error
              ? error.message
              : "An error occurred while sending emails.",
          variant: "destructive",
        });
      }
    });
  };

  const handleCopyClassCode = () => {
    navigator.clipboard
      .writeText(
        `https://www.classquest.app/classes?join_code=${course.class_code}`,
      )
      .then(
        () => {
          toast({
            title: "Copied!",
            description: "Class invite link has been copied to your clipboard.",
            variant: "default",
          });
        },
        (err) => {
          console.error("Could not copy text: ", err);
          toast({
            title: "Error",
            description: "Failed to copy class code.",
            variant: "destructive",
          });
        },
      );
  };

  // Function to handle class deletion
  const handleDeleteClass = () => {
    if (!courseToDelete) return;

    if (courseToDelete.name !== deleteCourseText) {
      toast({
        title: "Class names do not match!",
        description:
          "This is case-sensitive. Please double check what you typed and try again.",
        variant: "destructive",
      });
      return;
    }

    deleteMutation.mutate(courseToDelete.id);
    // We do NOT reset the state here; we do that in onSuccess or onError
  };

  return (
    <>
      {/* Action Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={"icon"}
            className={cn(className)}
            disabled={isSendingEmails}
          >
            <MoreVertical className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/classes/${classId}/edit`}>
              <SquarePen className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={copyToClipboard}>
            <Copy className="mr-2 h-4 w-4" /> Share behaviors/rewards
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleSendEmails}
            disabled={isSendingEmails}
          >
            <Mail className="mr-2 h-4 w-4" />
            Email dashboards
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger>
                  <HelpCircle className="ml-1" size={16} />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>
                    It may take up to several hours for the emails to arrive. In
                    testing, they never took more than 10 minutes to arrive.
                    Nonetheless, please plan accordingly.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleCopyClassCode}
            disabled={isSendingEmails}
          >
            <Copy className="mr-2 h-4 w-4" />
            Invite teachers
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger>
                  <HelpCircle className="ml-1" size={16} />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>
                    This will copy your class code. Send it to other teachers so
                    they can join as assistant teachers.{" "}
                    <strong>
                      Assistant teachers can only apply behaviors and
                      mark/unmark tasks complete.
                    </strong>
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="flex cursor-pointer items-center font-bold text-destructive hover:!bg-destructive hover:text-foreground"
            onSelect={() =>
              setCourseToDelete({ id: classId, name: course.class_name })
            }
            disabled={isSendingEmails || deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      {courseToDelete && (
        <Dialog
          // Keep the dialog open if deletion is pending
          open={!!courseToDelete}
          onOpenChange={(open) => {
            // Only allow closing if we're not deleting
            if (!open && !deleteMutation.isPending) {
              setCourseToDelete(null);
              setDeleteCourseText("");
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete class</DialogTitle>
              <DialogDescription>
                Please type the class name,{" "}
                <span className="font-bold">{courseToDelete.name}</span>, below
                to confirm deletion. Deleting a class is <b>IRREVERSIBLE</b>.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="class-to-delete" className="sr-only">
                  Class to delete
                </Label>
                <Input
                  id="class-to-delete"
                  placeholder="Type class name"
                  value={deleteCourseText}
                  onChange={(e) => setDeleteCourseText(e.target.value)}
                  disabled={isSendingEmails || deleteMutation.isPending}
                />
              </div>
            </div>
            <DialogFooter className="sm:justify-start">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSendingEmails || deleteMutation.isPending}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                onClick={handleDeleteClass}
                variant="destructive"
                disabled={deleteMutation.isPending || isSendingEmails}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete class"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Global Loading Overlay for Sending Emails */}
      {isSendingEmails && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black bg-opacity-50">
          <Loader2 className="h-24 w-24 animate-spin" />
          <div className="text-3xl font-bold">Letting the email owls fly!</div>
        </div>
      )}
    </>
  );
};

export default ClassActionMenu;
