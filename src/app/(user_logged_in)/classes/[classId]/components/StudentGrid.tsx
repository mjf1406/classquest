// components/StudentGrid.tsx

"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  BookOpen,
  CheckSquare,
  Edit,
  ListChecks,
  Check,
  X,
  Save,
  EllipsisVertical,
  Trash2,
  Loader,
  UserCheck,
  Monitor,
} from "lucide-react";
import type { StudentData } from "~/app/api/getClassesGroupsStudents/route";
import { FancyRadioGroup, type Option } from "./SelectRadioGroup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cn } from "~/lib/utils";
import ApplyBehaviorDialog from "./ApplyBehaviorsDialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "~/components/ui/dropdown-menu";
import EditStudentDialog from "./EditStudentDialog"; // Import the new dialog
import StudentDialog from "./StudentDialog"; // Import the student details dialog
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog"; // Import AlertDialog components
import { deleteStudent } from "../actions";
import { AddStudentsDialog } from "../../components/AddStudents";
import type { Student, TeacherCourse } from "~/server/db/types";
import { saveAttendance } from "../attendanceActions";
import { useToast } from "~/components/ui/use-toast";
import { useSuspenseQuery } from "@tanstack/react-query";
import { classesOptions } from "~/app/api/queryOptions";
import { useQueryClient, useMutation } from "@tanstack/react-query";

type SortingState = "student_number" | "last_name" | "first_name" | "points";

export type GroupData = {
  group_id: string;
  group_name: string;
  class_id: string;
  created_date: string;
  updated_date: string;
  students: StudentData[];
};

interface StudentRosterProps {
  students: StudentData[];
  classId: string;
  groups?: GroupData[];
}

const options: Option[] = [
  { value: "none", label: "None", icon: { prefix: "fas", iconName: "xmark" } },
  { value: "boys", label: "Boys", icon: { prefix: "fas", iconName: "child" } },
  {
    value: "girls",
    label: "Girls",
    icon: { prefix: "fas", iconName: "child-dress" },
  },
  { value: "odd", label: "Odd", icon: { prefix: "fas", iconName: "1" } },
  { value: "even", label: "Even", icon: { prefix: "fas", iconName: "2" } },
];

const StudentGrid: React.FC<StudentRosterProps> = ({
  students: initialStudents,
  classId,
  groups,
}) => {
  const [sortingState, setSortingState] = useState<SortingState>("first_name");
  const [students, setStudents] = useState<StudentData[]>(initialStudents);
  const [selectedFilter, setSelectedFilter] = useState<string>("none");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all");
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);
  const [selectedStudents, setSelectedStudents] = useState<StudentData[]>([]);
  const [isAttendanceMode, setIsAttendanceMode] = useState<boolean>(false);
  const [attendanceStatus, setAttendanceStatus] = useState<
    Record<string, "present" | "absent">
  >({});
  const [isAttendanceSaving, setIsAttendanceSaving] = useState<boolean>(false); // Loading state for attendance
  const [isBehaviorDialogOpen, setIsBehaviorDialogOpen] =
    useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [selectedStudentToEdit, setSelectedStudentToEdit] =
    useState<StudentData | null>(null);
  const [isStudentDialogOpen, setIsStudentDialogOpen] =
    useState<boolean>(false);
  const [selectedStudentToView, setSelectedStudentToView] =
    useState<StudentData | null>(null);
  const [isApplyBehaviorDialogOpen, setIsApplyBehaviorDialogOpen] =
    useState<boolean>(false);
  const { toast } = useToast();
  const { data: courses } = useSuspenseQuery(classesOptions);
  const course = courses.find((i) => i.class_id === classId);

  // State for deletion confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentData | null>(
    null,
  );

  // State for handling transitions
  const [isPending, startTransition] = useTransition();

  // New state for Compact Mode
  const [isCompactMode, setIsCompactMode] = useState<boolean>(false);

  // Query client for optimistic updates
  const queryClient = useQueryClient();

  // Mutation for saving attendance with optimistic updates
  const attendanceMutation = useMutation({
    mutationFn: async ({
      classId,
      date,
      absentStudentIds,
      studentIdsToUpdate,
    }: {
      classId: string;
      date: string;
      absentStudentIds: string[];
      studentIdsToUpdate?: string[];
    }) => {
      const result = await saveAttendance(
        classId,
        date,
        absentStudentIds,
        studentIdsToUpdate,
      );
      return result;
    },
    onMutate: async ({ classId, date, absentStudentIds }) => {
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
              const isAbsent = absentStudentIds.includes(student.student_id);
              const today = date;
              let newAbsentDates: string[] = student.absent_dates
                ? [...student.absent_dates]
                : [];
              if (isAbsent) {
                if (!newAbsentDates.includes(today)) {
                  newAbsentDates.push(today);
                }
              } else {
                newAbsentDates = newAbsentDates.filter((d) => d !== today);
              }
              return { ...student, absent_dates: newAbsentDates };
            });
            return { ...course, students: updatedStudents };
          }
          return course;
        });
      });
      return { previousClasses };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousClasses) {
        queryClient.setQueryData(["classes"], context.previousClasses);
      }
      toast({
        title: "Error",
        description: "Failed to save attendance.",
      });
    },
    onSuccess: (data, variables, context) => {
      if (data.success) {
        void queryClient.invalidateQueries(classesOptions);
        toast({
          title: "Success",
          description: "Attendance saved successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to save attendance.",
        });
      }
    },
    onSettled: () => {
      setIsAttendanceSaving(false);
      setIsAttendanceMode(false);
      setAttendanceStatus({});
    },
  });

  // Handler to update the students state when new students are added
  // Update the handleStudentsAdded function to match the exact StudentData type
  const handleStudentsAdded = (newStudents: Student[]) => {
    const convertedStudents: StudentData[] = newStudents.map((student) => ({
      // Required fields
      student_id: student.student_id ?? "", // Provide a default value for student_id
      student_name_en: student.student_name_en ?? "",
      student_name_first_en: student.student_name_first_en ?? "",
      student_name_last_en: student.student_name_last_en ?? "",

      // Nullable fields
      student_name_alt: student.student_name_alt ?? "",
      student_reading_level: student.student_reading_level ?? null,
      student_grade: student.student_grade ?? null,
      student_sex: student.student_sex ?? null,
      student_number: student.student_number ?? null,
      student_email: student.student_email ?? null,
      enrollment_date: student.enrollment_date ?? null,
      redemption_history: [],
    }));

    setStudents((prevStudents) => [...prevStudents, ...convertedStudents]);
  };

  // Function to open the ApplyBehaviorDialog
  const openApplyBehaviorDialog = () => {
    if (selectedStudents.length > 0) {
      setIsApplyBehaviorDialogOpen(true);
    }
  };

  // Function to close the ApplyBehaviorDialog
  const closeApplyBehaviorDialog = () => {
    setIsApplyBehaviorDialogOpen(false);
    setIsMultiSelectMode(false);
  };

  // Create a memoized empty array
  const emptyGroups = React.useMemo(() => [], []);
  groups = groups ?? emptyGroups;

  // Generate groupsOptions from groups prop
  const groupsOptions: Option[] = groups.map((group) => ({
    value: group.group_id,
    label: group.group_name,
    icon: { prefix: "fas", iconName: "users" },
  }));

  // Include "All Groups" option with value "all"
  const allGroupsOptions: Option[] = [
    {
      value: "all",
      label: "All Groups",
      icon: { prefix: "fas", iconName: "layer-group" },
    },
    ...groupsOptions,
  ];

  const getGroupName = (groupId: string) => {
    const group = groupsOptions.find((group) => group.value === groupId);
    return group ? group.label : "";
  };

  // Build a mapping from group_id to Set of student_ids
  const groupStudentIds = React.useMemo(() => {
    const mapping: Record<string, Set<string>> = {};
    if (groups.length > 0) {
      groups.forEach((group) => {
        mapping[group.group_id] = new Set(
          group.students.map((s) => s.student_id),
        );
      });
    }
    return mapping;
  }, [groups]);

  useEffect(() => {
    // Then sort the students
    const sortedStudents = [...initialStudents].sort((a, b) => {
      switch (sortingState) {
        case "student_number":
          return compareValues(
            Number(a.student_number),
            Number(b.student_number),
          );
        case "last_name":
          return compareValues(a.student_name_last_en, b.student_name_last_en);
        case "first_name":
          return compareValues(
            a.student_name_first_en,
            b.student_name_first_en,
          );
        case "points":
          return compareValues(b.points, a.points);
        default:
          return 0;
      }
    });
    setStudents(sortedStudents);
  }, [sortingState, initialStudents]);

  const compareValues = (
    a: string | number | undefined | null,
    b: string | number | undefined | null,
  ): number => {
    if (a === undefined && b === undefined) return 0;
    if (a === undefined) return -1;
    if (b === undefined) return 1;

    if (typeof a === "number" && typeof b === "number") {
      return a - b;
    }

    return String(a).localeCompare(String(b));
  };

  const handleSort = (value: string) => {
    setSortingState(value as SortingState);
  };

  const handleMultiSelectToggle = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    if (isMultiSelectMode) {
      setSelectedStudents([]);
    }
  };

  const getCurrentDate = (): string => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(now);
    const yearPart = parts.find((part) => part.type === "year");
    const monthPart = parts.find((part) => part.type === "month");
    const dayPart = parts.find((part) => part.type === "day");
    const year = yearPart ? yearPart.value : "";
    const month = monthPart ? monthPart.value : "";
    const day = dayPart ? dayPart.value : "";
    return `${year}-${month}-${day}`; // YYYY-MM-DD
  };

  const handleAttendanceToggle = () => {
    if (isAttendanceMode) {
      // Exiting attendance mode without saving
      setIsAttendanceMode(false);
      setAttendanceStatus({});
    } else {
      // Entering attendance mode
      const initialAttendance: Record<string, "present" | "absent"> = {};
      const today = getCurrentDate();
      students.forEach((student) => {
        const isAbsentToday = student.absent_dates?.includes(today);
        initialAttendance[student.student_id] = isAbsentToday
          ? "absent"
          : "present";
      });
      setAttendanceStatus(initialAttendance);
      setIsAttendanceMode(true);
    }
  };

  const handleStudentClick = (studentId: string) => {
    const student = students.find((s) => s.student_id === studentId);
    if (!student) return;

    if (isAttendanceMode) {
      // Toggle attendance status
      setAttendanceStatus((prevStatus) => ({
        ...prevStatus,
        [studentId]: prevStatus[studentId] === "present" ? "absent" : "present",
      }));
    } else if (isMultiSelectMode) {
      setSelectedStudents((prevSelected) => {
        if (prevSelected.some((s) => s.student_id === studentId)) {
          return prevSelected.filter((s) => s.student_id !== studentId);
        } else {
          return [...prevSelected, student];
        }
      });
    } else {
      setSelectedStudentToView(student);
      setIsStudentDialogOpen(true);
    }
  };

  const handleAdjustPoints = () => {
    if (selectedStudents.length > 0) {
      setIsBehaviorDialogOpen(true);
    }
  };

  const handleSelectAllPresent = () => {
    const today = getCurrentDate();
    const presentStudents = students.filter(
      (student) => !student.absent_dates?.includes(today),
    );
    setSelectedStudents(presentStudents);
    setIsMultiSelectMode(true);
  };

  const handleApplyClick = () => {
    if (!isMultiSelectMode) {
      const today = getCurrentDate();
      const presentStudents = students.filter(
        (student) => !student.absent_dates?.includes(today),
      );
      setSelectedStudents(presentStudents);
      setIsMultiSelectMode(true);
      setIsApplyBehaviorDialogOpen(true);
    }
    if (selectedStudents.length > 0) {
      setIsApplyBehaviorDialogOpen(true);
    }
  };

  // Updated handleSaveAttendance using optimistic updates via TanStack Query.
  // Note that we now pass the IDs of the students currently displayed.
  const handleSaveAttendance = () => {
    const date = getCurrentDate();
    const absentStudentIds = Object.keys(attendanceStatus).filter(
      (studentId) => attendanceStatus[studentId] === "absent",
    );
    setIsAttendanceSaving(true);
    const studentIdsToUpdate = students.map((student) => student.student_id);
    attendanceMutation.mutate({
      classId,
      date,
      absentStudentIds,
      studentIdsToUpdate,
    });
  };

  useEffect(() => {
    if (selectedFilter === "none" && selectedGroupFilter === "all") {
      setSelectedStudents([]);
    } else {
      let filteredStudents = [...students];

      if (selectedFilter !== "none") {
        filteredStudents = filteredStudents.filter((student) => {
          switch (selectedFilter) {
            case "boys":
              return student.student_sex === "male";
            case "girls":
              return student.student_sex === "female";
            case "odd":
              return Number(student.student_number) % 2 !== 0;
            case "even":
              return Number(student.student_number) % 2 === 0;
            default:
              return true;
          }
        });
      }

      if (selectedGroupFilter !== "all" && groups.length > 0) {
        const studentIdsInGroup = groupStudentIds[selectedGroupFilter];
        if (studentIdsInGroup) {
          filteredStudents = filteredStudents.filter((student) =>
            studentIdsInGroup.has(student.student_id),
          );
        } else {
          filteredStudents = [];
        }
      }

      setSelectedStudents(filteredStudents);
    }
  }, [
    selectedFilter,
    selectedGroupFilter,
    students,
    groups.length,
    groupStudentIds,
  ]);

  const handleStudentUpdate = (updatedStudent: StudentData) => {
    setStudents((prevStudents) =>
      prevStudents.map((student) =>
        student.student_id === updatedStudent.student_id
          ? updatedStudent
          : student,
      ),
    );
  };

  const closeStudentDialog = () => {
    setIsStudentDialogOpen(false);
    setSelectedStudentToView(null);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedStudentToEdit(null);
  };

  const openDeleteDialog = (student: StudentData) => {
    setStudentToDelete(student);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setStudentToDelete(null);
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;

    try {
      startTransition(async () => {
        const result = await deleteStudent(studentToDelete.student_id, classId);
        if (result.success) {
          setStudents((prevStudents) =>
            prevStudents.filter(
              (student) => student.student_id !== studentToDelete.student_id,
            ),
          );
          closeDeleteDialog();
        } else {
          console.error(result.message);
        }
      });
    } catch (error) {
      console.error("Failed to delete student:", error);
    }
  };

  const today = getCurrentDate();

  return (
    <div className="flex flex-col justify-center gap-4">
      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between">
        <div className="flex gap-2">
          <Button
            onClick={handleAttendanceToggle}
            variant={isAttendanceMode ? "secondary" : "default"}
          >
            <ListChecks size={16} className="sm:mr-2" />
            <span className="hidden sm:inline">
              {isAttendanceMode ? "Cancel Attendance" : "Attendance"}
            </span>
          </Button>
          <Button onClick={handleApplyClick}>
            <FontAwesomeIcon icon={["fas", "plus-minus"]} className="sm:mr-2" />
            <span className="hidden sm:inline">Apply</span>
          </Button>
          <Button
            variant={isMultiSelectMode ? "secondary" : "default"}
            onClick={handleMultiSelectToggle}
          >
            <CheckSquare size={16} className="sm:mr-2" />
            <span className="hidden sm:inline">
              {isMultiSelectMode ? "Exit Multi-select" : "Multi-select"}
            </span>
          </Button>
          {course?.role === "primary" && (
            <AddStudentsDialog
              classId={classId}
              existingStudents={students as unknown as Student[]}
              onStudentsAdded={handleStudentsAdded}
            />
          )}
          <Button
            variant={isCompactMode ? "secondary" : "default"}
            size={"icon"}
            onClick={() => setIsCompactMode(!isCompactMode)}
          >
            <Monitor size={16} />
          </Button>
        </div>
        <div className="flex flex-row items-center gap-2">
          <div className="mt-1 sm:mt-4">
            <Select onValueChange={handleSort} defaultValue="first_name">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student_number">Sort by Number</SelectItem>
                <SelectItem value="last_name">Sort by Last Name</SelectItem>
                <SelectItem value="first_name">Sort by First Name</SelectItem>
                <SelectItem value="points">Sort by Points</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div>
        <div className="flex flex-row items-center justify-start gap-2">
          {groups.length > 0 && (
            <FancyRadioGroup
              options={allGroupsOptions}
              value={selectedGroupFilter}
              onChange={setSelectedGroupFilter}
            />
          )}
          <FancyRadioGroup
            options={options}
            value={selectedFilter}
            onChange={setSelectedFilter}
          />
        </div>
        <div>
          {(selectedFilter !== "none" || selectedGroupFilter !== "all") && (
            <div className="text-sm text-gray-500">
              Selected {selectedStudents.length} student
              {selectedStudents.length !== 1 && "s"}
              {selectedGroupFilter !== "all" &&
                ` in ${getGroupName(selectedGroupFilter)}`}{" "}
              {selectedFilter !== "none" && `by ${selectedFilter}`}
            </div>
          )}
          {isMultiSelectMode && (
            <div className="text-sm text-gray-500">
              {selectedStudents.length} student
              {selectedStudents.length !== 1 && "s"} selected
            </div>
          )}
        </div>
      </div>

      {/* Student Grid */}
      <div
        className={`grid grid-cols-4 gap-2 lg:grid-cols-4 lg:gap-5 xl:grid-cols-6 2xl:grid-cols-8`}
      >
        {students.map((student) => {
          const isSelected = selectedStudents.some(
            (s) => s.student_id === student.student_id,
          );
          const attendance = attendanceStatus[student.student_id];
          const isAbsentToday = student.absent_dates?.includes(today);

          return (
            <Card
              key={student.student_id}
              className={cn(
                "relative col-span-1 h-fit transform cursor-pointer transition-transform hover:scale-105 md:h-full",
                isSelected && "bg-accent/25",
                !isSelected && selectedStudents.length >= 1 && "opacity-50",
                (isAttendanceMode || isMultiSelectMode) && "cursor-pointer",
                isAttendanceMode && attendance === "absent" && "opacity-40",
                !isAttendanceMode && isAbsentToday && "opacity-30",
              )}
              onClick={() => {
                handleStudentClick(student.student_id);
              }}
            >
              {isCompactMode ? (
                <>
                  <div className="absolute left-2 top-1 text-lg text-gray-500">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">
                          #{student.student_number}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Student number</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <CardHeader className="p-1 pt-5 md:p-6 md:pt-8">
                    <CardTitle className="flex flex-col text-center text-4xl font-bold text-primary">
                      {student.points ?? 0}
                    </CardTitle>
                  </CardHeader>
                </>
              ) : (
                <>
                  {isAttendanceMode && (
                    <div className="absolute bottom-0 right-0 m-1 flex items-center justify-center rounded-xl">
                      {attendance === "present" ? (
                        <Check
                          size={54}
                          className="text-green-500 opacity-50"
                        />
                      ) : (
                        <X size={54} className="text-red-500 opacity-50" />
                      )}
                    </div>
                  )}
                  <div className="text-2xs absolute left-1 top-1 md:text-sm">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">
                          #{student.student_number}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Student number</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {course?.role === "primary" && (
                    <div className="absolute bottom-1 right-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button
                            variant={"ghost"}
                            size={"icon"}
                            className="h-fit w-fit p-1 md:p-2"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <EllipsisVertical className="h-2 w-2 md:h-4 md:w-4" />{" "}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudentToEdit(student);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit size={16} className="mr-2" /> Edit student
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteDialog(student);
                            }}
                          >
                            <Trash2 size={16} className="mr-2" /> Delete student
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                  <div className="absolute right-1 top-1 flex flex-row items-center justify-center md:right-2 md:top-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">
                          <div className="text-2xs flex h-4 w-fit min-w-6 items-center justify-center rounded-full bg-primary p-0.5 text-background md:h-7 md:p-2 md:text-base">
                            {student.points ?? 0}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Points</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="absolute bottom-1 left-1 flex flex-row items-center justify-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">
                          <div className="text-2xs flex flex-row items-center justify-center md:text-base">
                            <BookOpen className="mr-1 h-2 w-2 md:h-4 md:w-4" />
                            {student.student_reading_level}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Reading level</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <CardHeader className="p-1 pt-5 md:p-6 md:pt-8">
                    <CardTitle className="flex flex-col text-center text-sm md:text-xl">
                      <div>{student.student_name_first_en}</div>
                      <div className="text-3xs md:text-xs">
                        {student.student_sex === "male" ? "Boy" : "Girl"}
                      </div>
                    </CardTitle>
                  </CardHeader>
                </>
              )}
            </Card>
          );
        })}
      </div>

      {/* Attendance Save Button */}
      <div className="flex w-full justify-end gap-2">
        {isAttendanceMode && (
          <Button onClick={handleSaveAttendance} disabled={isAttendanceSaving}>
            {isAttendanceSaving ? (
              <>
                <Loader size={16} className="mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Save attendance
              </>
            )}
          </Button>
        )}
      </div>

      {/* Dialogs */}
      {isStudentDialogOpen && selectedStudentToView && (
        <StudentDialog
          studentId={selectedStudentToView.student_id}
          classId={classId}
          onClose={closeStudentDialog}
        />
      )}
      {isEditDialogOpen && selectedStudentToEdit && (
        <EditStudentDialog
          isOpen={isEditDialogOpen}
          onClose={closeEditDialog}
          student={selectedStudentToEdit}
          onUpdate={handleStudentUpdate}
        />
      )}
      {isApplyBehaviorDialogOpen && (
        <ApplyBehaviorDialog
          selectedStudents={selectedStudents}
          classId={classId}
          onClose={closeApplyBehaviorDialog}
        />
      )}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>
                {studentToDelete?.student_name_first_en}{" "}
                {studentToDelete?.student_name_last_en}
              </strong>
              ? This action CANNOT be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStudent}
              disabled={isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Trash2 size={16} className="mr-2" />{" "}
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StudentGrid;
