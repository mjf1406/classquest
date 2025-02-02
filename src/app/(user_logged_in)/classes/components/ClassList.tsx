"use client";

import React, { useState, useTransition } from "react";
import { Button } from "~/components/ui/button";
import {
  Loader2,
  School,
  LayoutDashboard,
  NotebookPen,
  CircleCheckBig,
  HandHelpingIcon,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "~/components/ui/use-toast";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import addDemoClasses from "~/server/actions/addDemoClasses";
import NewClassDialog from "./NewClassDialog";
import { classesOptions } from "~/app/api/queryOptions";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  CardContent,
} from "~/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import JoinClassDialog from "./JoinClassDialog";
import ClassCodeDisplay from "./ClassCode";
import { FontAwesomeIconClient } from "~/components/FontAwesomeIconClient";
import ClassActionMenu from "./ClassActionMenu";

export default function ClassList() {
  const { toast } = useToast();
  const [isLoading, setLoading] = useState(false);

  const { data: courses = [] } = useSuspenseQuery(classesOptions);
  console.log("🚀 ~ ClassList ~ courses:", courses);

  async function addDemos() {
    setLoading(true);
    try {
      await addDemoClasses();
      window.location.reload();
    } catch (error) {
      console.error("Failed to add demo classes:", error);
      toast({
        title: "Failed to add demo classes!",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[hsl(var(--primary))]" />
        <span className="mt-4 text-lg text-[hsl(var(--foreground))]">
          Loading classes...
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap gap-5">
        <NewClassDialog />
        <JoinClassDialog />
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger>
              <Button variant="outline" disabled onClick={addDemos}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  </>
                ) : (
                  <>
                    <HandHelpingIcon className="mr-2 h-6 w-6" />
                    Add Demo Class
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Coming soon!</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.length === 0 ? (
          <div className="col-span-full flex flex-col items-center">
            <div className="rounded-lg bg-[hsl(var(--card))] p-6 text-[hsl(var(--card-foreground))] shadow-md">
              <div className="text-center">
                Add a class by clicking the button above.
              </div>
            </div>
          </div>
        ) : (
          courses.map((course) => {
            // Determine the icon based on the teacher's role
            const roleIcon =
              course.role.toLowerCase() === "primary"
                ? "fas crown"
                : "fas shield";

            return (
              <Card
                key={course.class_id}
                className="flex h-full w-full flex-col rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] shadow-lg"
              >
                <CardHeader className="relative">
                  <ClassActionMenu
                    className="absolute right-4 top-4 h-8 w-8 p-0"
                    classId={course.class_id}
                  />

                  <div className="flex items-center p-6">
                    <div className="flex-shrink-0">
                      <School className="h-12 w-12 text-[hsl(var(--accent))]" />
                    </div>
                    <div className="ml-4">
                      <CardTitle className="text-2xl font-bold">
                        {`${course.class_name} (${course.class_year})`}
                      </CardTitle>
                      <CardDescription className="mt-1 flex items-center text-sm">
                        <FontAwesomeIconClient
                          icon={roleIcon}
                          size={16}
                          className="mr-2 text-[hsl(var(--accent))]"
                        />
                        Grade {course.class_grade} - {course.role} teacher
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 px-6 py-4"></CardContent>
                <CardFooter className="flex items-center justify-start gap-2">
                  <Button asChild variant="outline">
                    <Link
                      href={{
                        pathname: `/classes/${course.class_id}`,
                        query: {
                          class_name: course?.class_name,
                          class_id: course?.class_id,
                        },
                      }}
                    >
                      <School className="mr-2 h-4 w-4" />
                      Open
                    </Link>
                  </Button>
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger>
                        <Button asChild variant="ghost" size={"icon"}>
                          <Link href={`/classes/${course.class_id}/dashboard`}>
                            <LayoutDashboard size={20} />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Dashboard</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger>
                        <Button asChild variant="ghost" size={"icon"}>
                          <Link href={`/classes/${course.class_id}/tasks`}>
                            <NotebookPen size={20} />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Tasks</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger>
                        <Button asChild variant="ghost" size={"icon"}>
                          <Link
                            href={`/classes/${course.class_id}/expectations`}
                          >
                            <CircleCheckBig size={20} />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Expectations</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>
    </>
  );
}
