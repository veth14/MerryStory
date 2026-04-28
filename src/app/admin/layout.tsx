import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="flex h-screen bg-[#fafafa]">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden relative z-20">
          <main className="flex-1 overflow-x-hidden overflow-y-auto w-full relative px-8 md:px-12 pb-16">
            <div className="sticky top-0 z-40 -mx-8 md:-mx-12">
              <AdminHeader />
            </div>
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
