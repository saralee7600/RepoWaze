import type { INode } from '@repowaze/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber, pluralize } from '@/lib/format';
import { getEntityMetadata } from '@/lib/graph';

interface EntityListProps {
  nodes: INode[];
}

export function EntityList({ nodes }: EntityListProps) {
  if (nodes.length === 0) {
    return <p className="text-sm text-muted-foreground">This project has no entities.</p>;
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {nodes.map((node) => {
        const metadata = getEntityMetadata(node);
        return (
          <li key={node.id} className="flex">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>{node.label}</CardTitle>
                {metadata && (
                  <CardDescription dir="ltr" className="font-mono text-xs">
                    {metadata.tableName} · {metadata.filePath}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {metadata ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(metadata.columns.length)} {pluralize(metadata.columns.length, 'column')}
                      {' · '}
                      {formatNumber(metadata.relations.length)} {pluralize(metadata.relations.length, 'relation')}
                    </p>
                    <ul dir="ltr" className="flex flex-wrap gap-1.5">
                      {metadata.columns.map((column) => (
                        <li
                          key={column.propertyName}
                          className="rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-xs text-foreground"
                        >
                          {column.propertyName}
                          <span className="text-muted-foreground">: {column.type}</span>
                          {column.primary && <span className="ms-1 text-primary">PK</span>}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">No parsed details available.</p>
                )}
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
