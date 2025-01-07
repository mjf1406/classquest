// src/app/(user_logged_in)/import/page.tsx

import { ContentLayout } from "~/components/admin-panel/content-layout";
import { Suspense } from "react";
import LoadingPage from "~/components/Loading";
import ImportPageServer from "./components/ImportServer";

// Define the shape of searchParams
interface ImportPageProps {
  searchParams: {
    import_code?: string;
  };
}

const ImportPage = async ({ searchParams }: ImportPageProps) => {
  return (
    <ContentLayout title="Import">
      <div className="mt-5 flex flex-col items-center justify-center gap-10">
        <Suspense fallback={<LoadingPage />}>
          <ImportPageServer searchParams={searchParams} />
        </Suspense>
      </div>
    </ContentLayout>
  );
};

export default ImportPage;
