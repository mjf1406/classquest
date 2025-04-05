"use client";

import React from "react";
import { ContentLayout } from "~/components/admin-panel/content-layout";
import { useSuspenseQuery } from "@tanstack/react-query";
import { classesOptions } from "~/app/api/queryOptions";
import type { Group } from "~/server/db/types";
import StudentGrid from "../../components/StudentGrid";
import {
  ChevronRight,
  CircleCheckBig,
  LayoutDashboard,
  NotebookPen,
} from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";

interface Params {
  classId: string;
  groupId: string;
  subgroupId: string;
}

export default function SubgroupDetails({ params }: { params: Params }) {
  const { classId, groupId, subgroupId } = params;

  const { data: coursesData = [] } = useSuspenseQuery(classesOptions);

  // Find the class data
  const classData = coursesData.find((course) => course.class_id === classId);

  if (!classData) {
    return (
      <ContentLayout title="Error">
        <div className="container flex flex-col items-center gap-12 px-4 py-16">
          <h1 className="text-5xl">Error retrieving class data</h1>
        </div>
      </ContentLayout>
    );
  }

  // Find the main group
  const mainGroup = classData?.groups?.find(
    (group) => group.group_id === groupId,
  );

  if (!mainGroup) {
    return (
      <ContentLayout title="Error">
        <div className="container flex flex-col items-center gap-12 px-4 py-16">
          <h1 className="text-5xl">Error retrieving group data</h1>
        </div>
      </ContentLayout>
    );
  }

  // Find the subgroup from main group's sub_groups
  const subgroup = mainGroup.sub_groups?.find(
    (group) => group.sub_group_id === subgroupId,
  );

  if (!subgroup) {
    return (
      <ContentLayout title="Error">
        <div className="container flex flex-col items-center gap-12 px-4 py-16">
          <h1 className="text-5xl">Error retrieving subgroup data</h1>
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title={subgroup.group_name ?? ""}>
      <title>{`${classData.class_name} | ${mainGroup.group_name} | ${subgroup.group_name}`}</title>
      <div className="container flex flex-col items-center gap-4 px-4 py-4">
        {/* Navigation Buttons */}
        <div className="flex flex-wrap gap-2 self-start">
          <Button asChild variant="outline" className="w-fit">
            <Link href={`/classes/${classData.class_id}/dashboard`}>
              <LayoutDashboard className="mr-2 h-5 w-5" /> Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-fit">
            <Link href={`/classes/${classData.class_id}/tasks`}>
              <NotebookPen className="mr-2 h-5 w-5" /> Tasks
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-fit">
            <Link href={`/classes/${classData.class_id}/expectations`}>
              <CircleCheckBig className="mr-2 h-5 w-5" /> Expectations
            </Link>
          </Button>
        </div>
        {/* Breadcrumb */}
        <div className="semi-bold flex items-center justify-center gap-2 self-start text-left text-3xl">
          <Link
            className="font-extrabold text-primary hover:underline"
            href={`/classes/${classData.class_id}`}
          >
            {classData.class_name}
          </Link>
          <ChevronRight />
          <Link
            className="font-extrabold text-primary hover:underline"
            href={`/classes/${classData.class_id}/${mainGroup.group_id}`}
          >
            {mainGroup.group_name}
          </Link>
          <ChevronRight />
          {subgroup.sub_group_name}
        </div>
        {/* Student Grid */}
        <div className="flex w-full flex-col gap-4">
          {subgroup.students && (
            <StudentGrid students={subgroup.students} classId={classId} />
          )}
        </div>
      </div>
    </ContentLayout>
  );
}
