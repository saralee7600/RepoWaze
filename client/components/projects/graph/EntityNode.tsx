import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Columns3, Table2, Waypoints } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { pluralize } from '@/lib/format';
import { NODE_WIDTH } from '@/lib/graph';

export type EntityNodeData = {
  label: string;
  tableName: string | null;
  columnCount: number;
  relationCount: number;
};

export type EntityFlowNode = Node<EntityNodeData, 'entity'>;

export function EntityNode({ data, selected }: NodeProps<EntityFlowNode>) {
  const { label, tableName, columnCount, relationCount } = data;

  return (
    <>
      <Handle type="target" position={Position.Left} />
      <Card
        size="sm"
        style={{ width: NODE_WIDTH }}
        className={selected ? 'ring-2 ring-primary' : 'ring-1 ring-border'}
      >
        <CardHeader>
          <CardTitle className="truncate" title={label}>
            {label}
          </CardTitle>
          {tableName && (
            <CardDescription className="flex items-center gap-1.5 truncate font-mono text-xs">
              <Table2 className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{tableName}</span>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Columns3 className="size-3.5 text-primary" aria-hidden="true" />
            {columnCount} {pluralize(columnCount, 'column')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Waypoints className="size-3.5 text-primary" aria-hidden="true" />
            {relationCount} {pluralize(relationCount, 'relation')}
          </span>
        </CardContent>
      </Card>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
