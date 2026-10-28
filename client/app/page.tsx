import { DashboardView } from '@/components/dashboard/DashboardView';
import { MOCK_PROJECTS } from '@/lib/mock-projects';

export default function DashboardPage() {
  return <DashboardView projects={MOCK_PROJECTS} />;
}
