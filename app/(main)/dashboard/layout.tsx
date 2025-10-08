import { Sidebar } from "@/components/Sidebar"
import { DashboardHeader } from "@/components/DashboardHeader"
import { Toaster } from 'sonner';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6 ">
          {children}
        
        </main>
      </div>
    </div>
  )
}
