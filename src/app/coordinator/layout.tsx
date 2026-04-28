import CoordinatorSidebar from '@/components/coordinator/CoordinatorSidebar';
import CoordinatorHeader from '@/components/coordinator/CoordinatorHeader';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['coordinator', 'staff']}>
      <div className="flex h-screen bg-[#fafafa]">
        <CoordinatorSidebar />
        <div className="flex-1 flex flex-col overflow-hidden relative z-20">
          <main className="flex-1 overflow-x-hidden overflow-y-auto w-full relative px-8 md:px-12 pb-16">
            <div className="sticky top-0 z-40 -mx-8 md:-mx-12">
              <CoordinatorHeader />
            </div>
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}