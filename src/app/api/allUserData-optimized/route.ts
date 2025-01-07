import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/server/db';
import { auth } from '@clerk/nextjs/server';
import { eq, and, or, isNull, inArray } from 'drizzle-orm';
import {
  classes,
  teacher_classes,
  groups,
  students,
  student_groups,
  student_classes,
  reward_items,
  behaviors,
  points,
  absent_dates,
  achievements,
  topics,
  assignments,
  student_assignments,
  expectations,
  student_expectations,
} from '~/server/db/schema';

import type {
  Achievement,
  Expectation,
  Point,
  RedemptionRecord,
  StudentExpectation,
  Topic,
} from '~/server/db/types';
import { InferModel } from 'drizzle-orm';

// Optional (If you want minimal caching in a Next.js App/Edge route):
export const revalidate = 30; // Revalidate data every 30s (ISR-like caching)
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Helper function to group data in memory
function groupBy<T, K extends string | number>(
  list: T[],
  keyGetter: (item: T) => K
): Map<K, T[]> {
  const map = new Map<K, T[]>();
  list.forEach((item) => {
    const key = keyGetter(item);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(item);
  });
  return map;
}

export type ClassData = {
  class_id: string;
  class_name: string;
  class_language: string;
  class_grade: string | null;
  class_year: string | null;
  class_code: string;
  created_date: string;
  updated_date: string;
  complete: {
    s1: boolean;
    s2: boolean;
  } | null;
  assigned_date: string | null;
  role: string | null;
  groups: {
    group_id: string;
    group_name: string;
    students: StudentData[];
  }[];
  students: StudentData[];
  reward_items: RewardItemData[];
  behaviors: BehaviorData[];
  topics: Topic[];
  assignments: AssignmentData[];
  expectations: Expectation[];
  student_expectations: StudentExpectation[];
};

export type AssignmentData = {
  id: string;
  user_id: string;
  class_id: string;
  name: string;
  description: string | null;
  data: string | null;
  due_date: string | null;
  topic: string | null;
  working_date: string | null;
  created_date: string;
  updated_date: string;
  students: {
    student_id: string;
    complete: boolean;
    completed_ts: string | null;
  }[];
};

export type StudentData = {
  student_id: string;
  student_name_en: string;
  student_name_first_en: string;
  student_name_last_en: string;
  student_name_alt: string | null;
  student_reading_level: string | null;
  student_grade: string | null;
  student_sex: 'male' | 'female' | null;
  student_number: number | null;
  student_email: string | null;
  enrollment_date: string | null;
  points?: number;
  point_history?: Omit<Point, 'updated_date'>[];
  absent_dates?: string[];
  redemption_history: RedemptionRecord[];
};

export type RewardItemData = {
  item_id: string;
  price: number;
  name: string;
  title?: string | null;
  description: string | null;
  icon: string | null;
  class_id: string | null;
  user_id: string;
  type: 'solo' | 'group' | 'class';
  achievements: Achievement[];
  created_date: string;
  updated_date: string;
};

export type BehaviorData = {
  behavior_id: string;
  title?: string | null;
  name: string;
  point_value: number;
  description: string | null;
  icon: string | null;
  color: string | null;
  class_id: string | null;
  user_id: string;
  achievements: Achievement[];
  created_date: string;
  updated_date: string;
};

async function fetchClassesWithDetails(userId: string): Promise<ClassData[]> {
  // 1) Fetch teacher_class + classes in one query.
  const classesData = await db
    .select({
      class_id: classes.class_id,
      class_name: classes.class_name,
      class_language: classes.class_language,
      class_grade: classes.class_grade,
      class_year: classes.class_year,
      class_code: classes.class_code,
      created_date: classes.created_date,
      updated_date: classes.updated_date,
      complete: classes.complete,
      assigned_date: teacher_classes.assigned_date,
      role: teacher_classes.role,
    })
    .from(teacher_classes)
    .innerJoin(classes, eq(teacher_classes.class_id, classes.class_id))
    .where(eq(teacher_classes.user_id, userId))
    .all();

  if (!classesData.length) return [];

  // Collect all classIds to do bulk queries.
  const classIds = classesData.map((c) => c.class_id);

  // 2) Fetch all data we need in bulk, **in parallel** using Promise.all.
  const [
    allGroups,
    allStudentClasses,
    allStudents,
    allPoints,
    allAbsentDates,
    allRewardItems,
    allBehaviors,
    allAchievements,
    allTopics,
    allAssignments,
    allStudentAssignments,
    allExpectations,
    allStudentExpectations,
  ] = await Promise.all([
    // Groups for all classes
    db.select().from(groups).where(inArray(groups.class_id, classIds)).all(),
    // Student-class relationships for all classes
    db
      .select({
        class_id: student_classes.class_id,
        student_id: student_classes.student_id,
        enrollment_date: student_classes.enrollment_date,
      })
      .from(student_classes)
      .where(inArray(student_classes.class_id, classIds))
      .all(),
    // Student details for ALL students across all classes
    db.select().from(students).all(),
    // Points for all classes
    db
      .select()
      .from(points)
      .where(inArray(points.class_id, classIds))
      .all(),
    // Absent dates for all classes
    db
      .select()
      .from(absent_dates)
      .where(inArray(absent_dates.class_id, classIds))
      .all(),
    // Reward items for all classes
    db
      .select({
        item_id: reward_items.item_id,
        price: reward_items.price,
        name: reward_items.name,
        title: reward_items.title,
        description: reward_items.description,
        icon: reward_items.icon,
        class_id: reward_items.class_id,
        user_id: reward_items.user_id,
        type: reward_items.type,
        created_date: reward_items.created_date,
        updated_date: reward_items.updated_date,
      })
      .from(reward_items)
      .where(inArray(reward_items.class_id, classIds))
      .all(),
    // Behaviors for all classes
    db
      .select({
        behavior_id: behaviors.behavior_id,
        name: behaviors.name,
        title: behaviors.title,
        point_value: behaviors.point_value,
        description: behaviors.description,
        icon: behaviors.icon,
        color: behaviors.color,
        class_id: behaviors.class_id,
        user_id: behaviors.user_id,
        created_date: behaviors.created_date,
        updated_date: behaviors.updated_date,
      })
      .from(behaviors)
      .where(inArray(behaviors.class_id, classIds))
      .all(),
    // Achievements for all classes
    db
      .select()
      .from(achievements)
      .where(inArray(achievements.class_id, classIds))
      .all(),
    // Topics for all classes
    db
      .select()
      .from(topics)
      .where(inArray(topics.class_id, classIds))
      .all(),
    // Assignments for all classes
    db
      .select()
      .from(assignments)
      .where(inArray(assignments.class_id, classIds))
      .all(),
    // Student assignments for all classes
    db
      .select()
      .from(student_assignments)
      .where(inArray(student_assignments.class_id, classIds))
      .all(),
    // Expectations for all classes
    db
      .select()
      .from(expectations)
      .where(inArray(expectations.class_id, classIds))
      .all(),
    // Student expectations for all classes
    db
      .select()
      .from(student_expectations)
      .where(inArray(student_expectations.class_id, classIds))
      .all(),
  ]);

  // 3) Create quick lookups / groupings in memory

  // => Group data
  const groupsByClass = groupBy(allGroups, (g) => g.class_id);
  const rewardItemsByClass = groupBy(allRewardItems, (ri) => ri.class_id ?? '');
  const behaviorsByClass = groupBy(allBehaviors, (b) => b.class_id ?? '');
  const achievementsByClass = groupBy(allAchievements, (ach) => ach.class_id);
  const topicsByClass = groupBy(allTopics, (t) => t.class_id);
  const assignmentsByClass = groupBy(allAssignments, (a) => a.class_id);
  const expectationsByClass = groupBy(allExpectations, (exp) => exp.class_id);
  const studentExpectationsByClass = groupBy(
    allStudentExpectations,
    (se) => se.class_id
  );

  // => Student-class relationships
  // This simply groups enrollment data by classId to know which students belong to which class.
  const studentClassesByClass = groupBy(
    allStudentClasses,
    (sc) => sc.class_id
  );

  // => Points & absent dates
  // We'll group points by studentId for easy summation.
  const pointsByStudent = groupBy(allPoints, (p) => p.student_id);
  // We'll do the same for absent dates
  const absentDatesByStudent = groupBy(allAbsentDates, (ad) => ad.student_id);

  // => Student Assignments
  // We'll group them by assignment_id so we can attach them to the assignment record.
  const studentAssignmentsByAssignment = groupBy(
    allStudentAssignments,
    (sa) => sa.assignment_id
  );

  // => Group membership
  // We can similarly group student_groups by group_id, but we already have “allGroups”.
  // So we fetch the student_groups for all groups in the classes:
  const allStudentGroups = await db
    .select({
      student_id: student_groups.student_id,
      group_id: student_groups.group_id,
      enrollment_date: student_groups.enrollment_date,
    })
    .from(student_groups)
    .where(inArray(student_groups.group_id, allGroups.map((g) => g.group_id)))
    .all();
  const studentGroupsByGroup = groupBy(allStudentGroups, (sg) => sg.group_id);

  // 4) Build final data shape in a single pass
  //    (No additional DB queries in the loop!)
  const classesWithDetails: ClassData[] = classesData.map((classData) => {
    const cid = classData.class_id;

    // #### Build Groups
    const groupsForThisClass = groupsByClass.get(cid) ?? [];
    const groupsWithStudents = groupsForThisClass.map((g) => {
      // find membership in student_groups for group g
      const memberRecords = studentGroupsByGroup.get(g.group_id) ?? [];
      // build each StudentData from `students` table + membership record
      const studentObjs = memberRecords.map((member) => {
        // Look up the full student row
        const studentRow = allStudents.find((s) => s.student_id === member.student_id);
        if (!studentRow) return null;

        // Build out points for this student
        const stPoints = pointsByStudent.get(studentRow.student_id) ?? [];
        const totalPoints = stPoints.reduce(
          (sum, point) => sum + point.number_of_points,
          0
        );
        const pointHistory = stPoints.map((pt) => ({
          id: pt.id,
          user_id: pt.user_id,
          class_id: pt.class_id,
          student_id: pt.student_id,
          behavior_id: pt.behavior_id,
          reward_item_id: pt.reward_item_id,
          type: pt.type,
          number_of_points: pt.number_of_points,
          created_date: pt.created_date,
        }));
        const redemptionHistory: RedemptionRecord[] = stPoints
          .filter((pt) => pt.type === 'redemption')
          .map((pt) => ({
            item_id: pt.reward_item_id!,
            date: pt.created_date,
            quantity: pt.number_of_points,
          }));
        const absDates = absentDatesByStudent.get(studentRow.student_id) ?? [];

        return {
          student_id: studentRow.student_id,
          student_name_en: studentRow.student_name_en,
          student_name_first_en: studentRow.student_name_first_en,
          student_name_last_en: studentRow.student_name_last_en,
          student_name_alt: studentRow.student_name_alt,
          student_reading_level: studentRow.student_reading_level,
          student_grade: studentRow.student_grade,
          student_sex: studentRow.student_sex,
          student_number: studentRow.student_number,
          student_email: studentRow.student_email,
          enrollment_date: member.enrollment_date, // or studentRow.enrollment_date
          points: totalPoints,
          point_history: pointHistory,
          absent_dates: absDates.map((d) => d.date),
          redemption_history: redemptionHistory,
        } as StudentData;
      }).filter(Boolean) as StudentData[];

      return {
        group_id: g.group_id,
        group_name: g.group_name,
        students: studentObjs,
      };
    });

    // #### Build allStudentsData (i.e., the entire class’s students)
    // look up the student_class records
    const studentClassRecords = studentClassesByClass.get(cid) ?? [];
    const allStudentsData: StudentData[] = studentClassRecords.map((sc) => {
      const studentRow = allStudents.find((s) => s.student_id === sc.student_id);
      if (!studentRow) return null;

      // Build out points for this student
      const stPoints = pointsByStudent.get(studentRow.student_id) ?? [];
      const totalPoints = stPoints.reduce(
        (sum, point) => sum + point.number_of_points,
        0
      );
      const pointHistory = stPoints.map((pt) => ({
        id: pt.id,
        user_id: pt.user_id,
        class_id: pt.class_id,
        student_id: pt.student_id,
        behavior_id: pt.behavior_id,
        reward_item_id: pt.reward_item_id,
        type: pt.type,
        number_of_points: pt.number_of_points,
        created_date: pt.created_date,
      }));
      const redemptionHistory: RedemptionRecord[] = stPoints
        .filter((pt) => pt.type === 'redemption')
        .map((pt) => ({
          item_id: pt.reward_item_id!,
          date: pt.created_date,
          quantity: pt.number_of_points,
        }));
      const absDates = absentDatesByStudent.get(studentRow.student_id) ?? [];

      return {
        student_id: studentRow.student_id,
        student_name_en: studentRow.student_name_en,
        student_name_first_en: studentRow.student_name_first_en,
        student_name_last_en: studentRow.student_name_last_en,
        student_name_alt: studentRow.student_name_alt,
        student_reading_level: studentRow.student_reading_level,
        student_grade: studentRow.student_grade,
        student_sex: studentRow.student_sex,
        student_number: studentRow.student_number,
        student_email: studentRow.student_email,
        enrollment_date: sc.enrollment_date,
        points: totalPoints,
        point_history: pointHistory,
        absent_dates: absDates.map((d) => d.date),
        redemption_history: redemptionHistory,
      } as StudentData;
    }).filter(Boolean) as StudentData[];

    // #### Augment behaviors with achievements
    const behaviorsForClass = behaviorsByClass.get(cid) ?? [];
    const achievementsForClass = achievementsByClass.get(cid) ?? [];
    // Group achievements by behavior_id & reward_item_id
    const achievementsByBehavior = new Map<string, Achievement[]>();
    const achievementsByRewardItem = new Map<string, Achievement[]>();

    achievementsForClass.forEach((ach) => {
      if (ach.behavior_id) {
        if (!achievementsByBehavior.has(ach.behavior_id)) {
          achievementsByBehavior.set(ach.behavior_id, []);
        }
        achievementsByBehavior.get(ach.behavior_id)!.push(ach);
      }
      if (ach.reward_item_id) {
        if (!achievementsByRewardItem.has(ach.reward_item_id)) {
          achievementsByRewardItem.set(ach.reward_item_id, []);
        }
        achievementsByRewardItem.get(ach.reward_item_id)!.push(ach);
      }
    });

    // Attach achievements to behaviors
    const behaviorsWithAchievements = behaviorsForClass.map((b) => ({
      ...b,
      achievements: achievementsByBehavior.get(b.behavior_id) ?? [],
    }));

    // #### Augment reward items with achievements
    const rewardItemsForClass = rewardItemsByClass.get(cid) ?? [];
    const rewardItemsWithAchievements = rewardItemsForClass.map((ri) => ({
      ...ri,
      achievements: achievementsByRewardItem.get(ri.item_id) ?? [],
    }));

    // #### Build assignments
    const assignmentsForClass = assignmentsByClass.get(cid) ?? [];
    const assignmentsWithStudents = assignmentsForClass.map((assignment) => {
      const saRecords = studentAssignmentsByAssignment.get(assignment.id) ?? [];
      return {
        ...assignment,
        students: saRecords.map((sa) => ({
          student_id: sa.student_id,
          complete: !!sa.complete,
          completed_ts: sa.completed_ts,
        })),
      };
    });

    // #### Topics, expectations, student expectations
    const topicsForClass = topicsByClass.get(cid) ?? [];
    const expectationsForClass = expectationsByClass.get(cid) ?? [];
    const studentExpectationsForClass =
      studentExpectationsByClass.get(cid) ?? [];

    // 5) Return the assembled structure
    return {
      ...classData,
      groups: groupsWithStudents,
      students: allStudentsData,
      reward_items: rewardItemsWithAchievements,
      behaviors: behaviorsWithAchievements,
      topics: topicsForClass,
      assignments: assignmentsWithStudents,
      expectations: expectationsForClass,
      student_expectations: studentExpectationsForClass,
    } as ClassData;
  });

  return classesWithDetails;
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('User ID is null');
    }

    const classesData = await fetchClassesWithDetails(userId);

    return NextResponse.json(classesData, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { message: 'Unable to fetch classes due to an internal error.' },
      { status: 500 }
    );
  }
}
