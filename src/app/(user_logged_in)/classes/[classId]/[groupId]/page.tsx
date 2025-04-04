"use client";

import React from "react";
import { ContentLayout } from "~/components/admin-panel/content-layout";
import { useSuspenseQuery } from "@tanstack/react-query";
import { classesOptions } from "~/app/api/queryOptions";
import type { Group } from "~/server/db/types";
import StudentGrid from "../components/StudentGrid";
import {
  ChevronRight,
  CircleCheckBig,
  LayoutDashboard,
  NotebookPen,
} from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import ClassSubgroupComponent from "../../components/ClassSubGroups";

interface Params {
  classId: string;
  groupId: string;
}

export default function ClassDetails({ params }: { params: Params }) {
  const classId = params.classId;
  const groupId = params.groupId;

  const { data: coursesData = [] } = useSuspenseQuery(classesOptions);

  const Data = coursesData.find((course) => course.class_id === classId);
  const courseData: Group | undefined = Data?.groups?.find(
    (group) => group.group_id === groupId,
  );
  const subgroups: Group[] | [] = courseData?.sub_groups ?? [];

  if (!courseData) {
    return (
      <ContentLayout title="Error">
        <div className="container flex flex-col items-center gap-12 px-4 py-16">
          <h1 className="text-5xl">Error retrieving student roster</h1>
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title={courseData.group_name ?? ""}>
      <title>{`${Data?.class_name} | ${courseData.group_name}`}</title>
      {/* <meta name="description" content={} /> */}
      <div className="container flex flex-col items-center gap-4 px-4 py-4">
        <div className="flex flex-wrap gap-2 self-start">
          <Button asChild variant="outline" className="w-fit">
            <Link href={`/classes/${Data?.class_id}/dashboard`}>
              <LayoutDashboard className="mr-2 h-5 w-5" /> Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-fit">
            <Link href={`/classes/${Data?.class_id}/tasks`}>
              <NotebookPen className="mr-2 h-5 w-5" /> Tasks
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-fit">
            <Link href={`/classes/${Data?.class_id}/expectations`}>
              <CircleCheckBig className="mr-2 h-5 w-5" /> Expectations
            </Link>
          </Button>
        </div>
        <div className="semi-bold flex items-center justify-center gap-2 self-start text-left text-3xl">
          <Link
            className="font-extrabold text-primary hover:underline"
            href={`/classes/${Data?.class_id}`}
          >
            {Data?.class_name}
          </Link>
          <ChevronRight />
          {courseData.group_name}
        </div>
        <ClassSubgroupComponent
          params={{ classId, groupId }}
          subgroups={subgroups}
        />
        <div className="flex w-full flex-col gap-4">
          {courseData.students && (
            <StudentGrid students={courseData.students} classId={classId} />
          )}
        </div>
      </div>
    </ContentLayout>
  );
}
