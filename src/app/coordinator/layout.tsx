import CoordinatorSidebar from '@/components/coordinator/CoordinatorSidebar';
import CoordinatorHeader from '@/components/coordinator/CoordinatorHeader';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['coordinator']}>
      <div className="flex h-screen bg-[#fafafa]">
        <CoordinatorSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <CoordinatorHeader />
          <main className="flex-1 overflow-x-hidden overflow-y-auto w-full px-8 md:px-12 pb-16">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}