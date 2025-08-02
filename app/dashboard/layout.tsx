import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/features/dashboard/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden ">
        <DashboardSidebar initialPlaygroundData={[]} />
        <main className="flex1">{children}</main>
      </div>
    </SidebarProvider>
  );
}
