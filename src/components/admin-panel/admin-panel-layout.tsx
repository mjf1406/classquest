"use client";

import { cn } from "~/lib/utils";
import { useStore } from "~/hooks/use-store";
import { Sidebar } from "~/components/admin-panel/sidebar";
import { useSidebarToggle } from "~/hooks/use-sidebar-toggle";
import Footer from "../navigation/Footer";

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebar = useStore(useSidebarToggle, (state) => state);

  if (!sidebar) return null;

  return (
    <>
      <Sidebar />
      <main
        className={cn(
          "min-h-dvh bg-zinc-50 transition-[margin-left] duration-300 ease-in-out dark:bg-zinc-900",
          sidebar?.isOpen === false ? "lg:ml-[90px]" : "lg:ml-72",
        )}
      >
        {children}
      </main>
      <Footer />
      {/* <footer
        className={cn(
          "transition-[margin-left] duration-300 ease-in-out",
          sidebar?.isOpen === false ? "lg:ml-[90px]" : "lg:ml-72",
        )}
      >
        <Footer />
      </footer> */}
    </>
  );
}

// replaced min-h-[calc(100vh_-_56px)] from the <main> cn with min-h-dvh
