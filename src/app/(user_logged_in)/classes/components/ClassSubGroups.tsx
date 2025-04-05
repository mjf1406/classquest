"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { Group } from "~/server/db/types";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";

interface Params {
  classId: string;
  groupId: string;
}

interface ClassSubgroupComponentProps {
  subgroups: Group[];
  params: Params;
}

const ClassSubgroupComponent: React.FC<ClassSubgroupComponentProps> = ({
  subgroups,
  params,
}) => {
  const { classId, groupId } = params;
  const [groups, setGroups] = useState<Group[]>(subgroups);

  useEffect(() => {
    setGroups(subgroups);
  }, [subgroups]);

  return (
    <>
      <div className="self-start text-3xl">Teams</div>
      <Button className="self-start">
        <Plus className="mr-2 h-6 w-6" /> Add team
      </Button>
      <div className="grid grid-cols-3 gap-2 self-start md:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7">
        {groups.map((group) => (
          <Card key={group.group_id} className="relative col-span-1">
            <Link
              href={`/classes/${classId}/${groupId}/${group.sub_group_id}`}
              className="block p-2 md:p-4"
            >
              <CardHeader className="-px-2">
                <CardTitle className="text-center text-sm md:text-xl">
                  {group.sub_group_name}
                </CardTitle>
                <CardDescription className="text-2xs flex w-full flex-row items-center justify-center gap-2 text-center md:text-xs">
                  <div>{group.students.length} students</div>
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
        ))}
      </div>
    </>
  );
};

export default ClassSubgroupComponent;
