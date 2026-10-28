import { Download } from 'lucide-react';

export default function ImportProjectPage() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Download className="size-6" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-foreground">Import Project</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        The GitHub import form is coming in the next phase.
      </p>
    </div>
  );
}
