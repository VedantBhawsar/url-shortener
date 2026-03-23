import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";

export function DashboardLayout() {
  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
        {/* Nested route pages render here */}
        <Outlet />
      </main>
    </div>
  );
}