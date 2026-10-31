/** Signed-out pages (login): a bare, centred canvas without the app shell. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10 text-foreground">
      {children}
    </main>
  );
}
