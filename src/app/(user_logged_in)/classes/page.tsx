import { ContentLayout } from "~/components/admin-panel/content-layout";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { Suspense } from "react";
import ClassList from "./components/ClassList";
import LoadingPage from "~/components/Loading";
import { classesOptions } from "~/app/api/queryOptions";

export default async function MyClassesPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(classesOptions);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ContentLayout title="My Classes">
        <div className="mt-5 flex flex-col items-center justify-center gap-10">
          <Suspense fallback={<LoadingPage />}>
            <ClassList />
          </Suspense>
        </div>
      </ContentLayout>
    </HydrationBoundary>
  );
}
