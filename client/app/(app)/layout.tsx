import { AppLayout } from "@/components/layout/AppLayout";

export default function AppShellLayout({ children }: LayoutProps<"/">) {
  return <AppLayout>{children}</AppLayout>;
}
