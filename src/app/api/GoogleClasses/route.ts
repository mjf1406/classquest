import { auth, clerkClient } from '@clerk/nextjs/server';
import { google, type classroom_v1 } from 'googleapis';
import { type NextRequest, NextResponse } from 'next/server';
import { VERCEL_REGIONS } from '~/lib/constants';

export const dynamic = 'force-dynamic';

export type GoogleClassroom = {
  id: string;
  name: string;
  descriptionHeading: string;
  room: string;
  ownerId: string;
  creationTime: string;
  updateTime: string;
  enrollmentCode: string;
  courseState: 'ACTIVE' | 'ARCHIVED' | 'PROVISIONED' | 'DECLINED' | 'SUSPENDED';
  alternateLink: string;
  teacherGroupEmail: string;
  courseGroupEmail: string;
  teacherFolder: {
    id: string;
    title: string;
    alternateLink: string;
  };
  guardiansEnabled: boolean;
  calendarId: string;
  gradebookSettings: {
    calculationType: 'TOTAL_POINTS' | 'WEIGHTED_CATEGORIES';
    displaySetting: 'HIDE_OVERALL_GRADE' | 'SHOW_OVERALL_GRADE';
  };
  students: GoogleClassroomStudent[];
}

export type GoogleClassroomStudent = {
  courseId: string;
  userId: string;
  profile: {
    id: string;
    name: {
      givenName: string;
      familyName: string;
      fullName: string;
    };
    emailAddress: string;
    permissions: {
      permission: string;
    }[];
  };
}

async function fetchStudents(classroomClient: classroom_v1.Classroom, courseId: string) {
  try {
    const res = await classroomClient.courses.students.list({
      courseId: courseId,
    });
    return res.data.students ?? [];
  } catch (error) {
    console.error(`Failed to fetch students for course ${courseId}:`, error);
    return []; // Return an empty array if there's an error
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
  
    if (!userId) {
      return NextResponse.json({ message: "User is not authenticated" }, { status: 401 });
    }
  
    const clerkResponse = await clerkClient.users.getUserOauthAccessToken(userId, 'oauth_google');
    
    const accessToken = clerkResponse.data[0]?.token;

    if (!accessToken) {
      return NextResponse.json({ message: "Failed to retrieve Google OAuth token" }, { status: 401 });
    }
  
    const region = process.env.VERCEL_REGION as keyof typeof VERCEL_REGIONS;
    if (region && VERCEL_REGIONS[region]) {
      console.log(`Hello from ${VERCEL_REGIONS[region]}`);
    } else {
      console.log('Hello from an unknown region');
    }

    const authClient = new google.auth.OAuth2();
    authClient.setCredentials({ access_token: accessToken });
  
    const classroomClient: classroom_v1.Classroom = google.classroom({ version: 'v1', auth: authClient });
  
    const coursesResponse = await classroomClient.courses.list({});
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (!coursesResponse.data || !coursesResponse.data.courses || coursesResponse.data.courses.length === 0) {
      return NextResponse.json({ message: 'No courses found' }, { status: 404 });
    }

    const courses = await Promise.all(coursesResponse.data.courses.map(async (course) => {
      const students = await fetchStudents(classroomClient, course.id!);
      return {
        ...course,
        students: students,
      };
    }));

    return NextResponse.json(courses);
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ message: 'Unexpected error', error: (err as Error).message }, { status: 500 });
  }
}