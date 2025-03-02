"use client";

import { useState } from "react";
import type { StudentData } from "~/app/api/getClassesGroupsStudents/route";
import type {
  TeacherCourse,
  StudentExpectation,
  Expectation,
} from "~/server/db/types";
import { Button } from "~/components/ui/button";
import EditSingleExpectationDialog from "./EditSingleExpectation";
import { Edit } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import EditExpectationDialog from "./EditExpectationDialog";

interface StudentsTableProps {
  courseData: TeacherCourse;
}

interface SelectedStudentExp {
  student: StudentData;
  expectation: Expectation;
  studentExpectation?: StudentExpectation;
}

export default function StudentsExpectationsTable({
  courseData,
}: StudentsTableProps) {
  const [selectedStudentExp, setSelectedStudentExp] =
    useState<SelectedStudentExp | null>(null);
  const [selectedExpectation, setSelectedExpectation] =
    useState<Expectation | null>(null);

  const expectations = courseData.expectations ?? [];

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse border">
        <thead>
          <TableRow>
            <TableHead className="border p-2 text-left">Student Name</TableHead>
            {expectations.map((exp) => (
              <TableHead key={exp.id} className="border p-2 text-left">
                <div className="flex items-center justify-between">
                  <span>{exp.name}</span>
                  {courseData.role === "primary" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedExpectation(exp)}
                    >
                      <Edit size={18} />
                    </Button>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </thead>
        <tbody>
          {courseData.students?.map((student) => {
            const studentExps = courseData.student_expectations.filter(
              (se) => se.student_id === student.student_id,
            );

            return (
              <tr key={student.student_id} className="hover:bg-gray-50">
                <td className="border p-2">
                  {student.student_name_first_en} {student.student_name_last_en}
                </td>

                {expectations.map((exp) => {
                  const studentExp = studentExps.find(
                    (se) => se.expectation_id === exp.id,
                  );
                  const displayValue =
                    studentExp?.value ?? studentExp?.number ?? "—";

                  return (
                    <td key={exp.id} className="border p-2 text-left">
                      <div className="flex items-center justify-between">
                        <span>{displayValue}</span>
                        {courseData.role === "primary" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setSelectedStudentExp({
                                student,
                                expectation: exp,
                                studentExpectation: studentExp,
                              })
                            }
                          >
                            <Edit size={18} />
                          </Button>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {selectedStudentExp && (
        <EditSingleExpectationDialog
          student={selectedStudentExp.student}
          expectation={selectedStudentExp.expectation}
          studentExpectation={selectedStudentExp.studentExpectation}
          classId={courseData.class_id}
          onClose={() => setSelectedStudentExp(null)}
        />
      )}
      {selectedExpectation && (
        <EditExpectationDialog
          expectation={selectedExpectation}
          classId={courseData.class_id}
          onClose={() => setSelectedExpectation(null)}
        />
      )}
    </div>
  );
}
