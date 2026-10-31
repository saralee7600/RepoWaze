import Link from 'next/link';
import { FolderSearch } from 'lucide-react';
import { buttonStyles } from '@/components/ui/buttonStyles';

export default function ProjectNotFound() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FolderSearch className="size-6" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-foreground">Project not found</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        This project doesn&apos;t exist or has been removed. Head back to the dashboard to pick another one.
      </p>
      <Link href="/" className={buttonStyles({ className: 'mt-6' })}>
        Back to projects
      </Link>
    </div>
  );
}
