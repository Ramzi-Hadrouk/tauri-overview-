import { DashboardShell } from '@/frontend/shared/layouts/dashboard-shell';
import { ClientsLayout } from '@/frontend/modules/(dashboard)/clients/layouts/ClientsLayout';
import { ClientListSection } from '@/frontend/modules/(dashboard)/clients/feature-client-list/sections/ClientListSection';

export default function ClientsPage() {
  return (
    <DashboardShell>
      <ClientsLayout>
        <ClientListSection />
      </ClientsLayout>
    </DashboardShell>
  );
}