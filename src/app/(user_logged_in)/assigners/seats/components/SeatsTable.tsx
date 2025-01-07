import React, { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { TeacherCourse } from "~/server/db/types";

export interface SeatData {
  neighbors: string[];
  seats: number[];
}

interface SeatsTableProps {
  data: Record<string, SeatData>;
  classData: TeacherCourse | undefined;
}

const SeatsTable: React.FC<SeatsTableProps> = ({ data, classData }) => {
  const studentIds = Object.keys(data);

  const studentMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (classData?.students) {
      classData.students.forEach((student) => {
        const fullName = `${student.student_name_first_en} ${student.student_name_last_en}`;
        map[student.student_id] = fullName;
      });
    }
    return map;
  }, [classData]);

  return (
    <div className="overflow-x-auto">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead>Student Name</TableHead>
            <TableHead>Neighbors</TableHead>
            <TableHead>Neighbor Count</TableHead>
            <TableHead>Seats</TableHead>
            <TableHead>Seat Count</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {studentIds.map((studentId) => {
            const seatData = data[studentId];

            if (!seatData) {
              return (
                <TableRow key={studentId}>
                  <TableCell colSpan={5} className="text-red-500">
                    Data missing for {studentId}
                  </TableCell>
                </TableRow>
              );
            }

            const { neighbors, seats } = seatData;

            const studentInfo = classData?.students?.find(
              (item) => item.student_id === studentId,
            );

            const neighborCounts = neighbors.reduce<Record<string, number>>(
              (acc, neighborId) => {
                acc[neighborId] = (acc[neighborId] ?? 0) + 1;
                return acc;
              },
              {},
            );

            const neighborDisplay = Object.entries(neighborCounts).map(
              ([neighborId, count]) => {
                const neighborName = studentMap[neighborId] ?? neighborId;
                return (
                  <div key={neighborId} className="inline-block w-1/2">
                    {neighborName}: {count}
                  </div>
                );
              },
            );

            const neighborCount = neighbors.length;
            const seatCount = seats.length;

            return (
              <TableRow key={studentId}>
                <TableCell>
                  {studentInfo
                    ? `${studentInfo.student_name_first_en} ${studentInfo.student_name_last_en}`
                    : studentId}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap">
                    {neighborDisplay.length > 0
                      ? neighborDisplay
                      : "No neighbors"}
                  </div>
                </TableCell>
                <TableCell className="text-center">{neighborCount}</TableCell>
                <TableCell>
                  {seats.length > 0 ? seats.join(", ") : "No seats assigned"}
                </TableCell>
                <TableCell className="text-center">{seatCount}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default SeatsTable;
