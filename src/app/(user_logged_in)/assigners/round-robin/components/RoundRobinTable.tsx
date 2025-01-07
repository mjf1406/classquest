"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { TeacherCourse } from "~/server/db/types";

interface RoundRobinTableProps {
  data: Record<string, Record<string, number>>;
  classData: TeacherCourse | undefined;
}

const RoundRobinTable: React.FC<RoundRobinTableProps> = ({
  data,
  classData,
}) => {
  const roles = Object.keys(data);
  const studentIds = Array.from(
    new Set(Object.values(data).flatMap((students) => Object.keys(students))),
  ).sort();

  return (
    <div className="overflow-x-auto">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead>Student ID</TableHead>
            {roles.map((role) => (
              <TableHead key={role}>{role}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {studentIds.map((studentId) => (
            <TableRow key={studentId}>
              <TableCell>
                {classData
                  ? classData?.students?.find((i) => i.student_id === studentId)
                      ?.student_name_first_en +
                    " " +
                    classData?.students?.find((i) => i.student_id === studentId)
                      ?.student_name_last_en
                  : studentId}
              </TableCell>
              {roles.map((role) => (
                <TableCell key={`${studentId}-${role}`}>
                  {data?.role?.[studentId] ?? 0}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RoundRobinTable;
