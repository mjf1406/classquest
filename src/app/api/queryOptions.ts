import { queryOptions } from '@tanstack/react-query'
import type { Assigner, Behavior, RandomEvent, RewardItem, TeacherCourse } from '~/server/db/types';
import type { GoogleClassroom } from './GoogleClasses/route';
import type { TotalSignups } from './getWaitlistCount/route';

export const GoogleClassOptions = queryOptions<GoogleClassroom[]>({
  queryKey: ["google-classes"],
  queryFn: async () => {
    const response = await fetch("/api/GoogleClasses");
    return response.json()
  }
})

export const assignerOptions = queryOptions<Assigner[]>({
    queryKey: ["assigners"],
    queryFn: async () => {
        const response = await fetch("/api/getAssigners");
        return response.json();
      },
})

export const waitlistOptions = queryOptions<TotalSignups>({
  queryKey: ["waitlist"],
  queryFn: async () => {
    const response = await fetch("/api/getWaitlistCount");
    return response.json();
  },
})

export const classesOptions = queryOptions<TeacherCourse[]>({
    queryKey: ["classes"],
    queryFn: async () => {
        // const response = await fetch("/api/getClassesGroupsStudents"); // 1659.6ms average response time
        // const response = await fetch("/api/allUserData-turso"); // 1698.3ms average response time
        const response = await fetch("/api/allUserData-optimized"); // 603.7ms average response time
        // const response = await fetch("/api/allUserData-optimized-turso"); // 1826.5ms average response time
        return response.json();
      },
})

export const randomEventsOptions = queryOptions<RandomEvent[]>({
  queryKey: ["random-events"],
  queryFn: async () => {
      const response = await fetch("/api/getRandomEvents");
      return response.json();
    },
})

export const behaviorsOptions = queryOptions<Behavior[]>({
  queryKey: ["behaviors"],
  queryFn: async () => {
    const response = await fetch("/api/getBehaviors");
    return response.json();
  },
});

export const rewardItemsOptions = queryOptions<RewardItem[]>({
  queryKey: ["reward-items"],
  queryFn: async () => {
    const response = await fetch("/api/getRewardItems");
    return response.json();
  },
});