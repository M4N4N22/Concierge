import { Sidebar } from "@/components/Sidebar";
import { DashboardHeader } from "@/components/DashboardHeader";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader />
        <main className="brand-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4 md:px-6">
          <div className="min-h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
