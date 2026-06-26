import { DashboardShell } from '@/frontend/shared/layouts/dashboard-group/dashboard-layout';
import { ItemListSection, ItemFormHost } from '@/frontend/modules/(dashboard)/items';

export default function ItemsPage() {
  return (
    <DashboardShell>
      <ItemListSection />
      <ItemFormHost />
    </DashboardShell>
  );
}
