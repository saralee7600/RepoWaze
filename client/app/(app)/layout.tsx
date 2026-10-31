import { AppLayout } from "@/components/layout/AppLayout";

/** Authenticated area: every page in this group renders inside the sidebar/header shell. */
export default function AppShellLayout({ children }: LayoutProps<"/">) {
  return <AppLayout>{children}</AppLayout>;
}
