'use client';

import { useMemo } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useNodesState,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { IEdge, INode } from '@repowaze/shared';
import { Waypoints } from 'lucide-react';
import { EntityNode } from './EntityNode';
import { buildFlowGraph } from './build-flow';

// Declared at module level so React Flow doesn't see a new object every render.
const nodeTypes: NodeTypes = { entity: EntityNode };

/** Hide the minimap on small graphs, where it adds clutter rather than orientation. */
const MINIMAP_MIN_NODES = 8;

interface ProjectGraphProps {
  nodes: INode[];
  edges: IEdge[];
}

export function ProjectGraph({ nodes, edges }: ProjectGraphProps) {
  const initial = useMemo(() => buildFlowGraph(nodes, edges), [nodes, edges]);
  const [flowNodes, , onNodesChange] = useNodesState(initial.nodes);

  if (nodes.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground">
        <Waypoints className="size-6" aria-hidden="true" />
        This project has no nodes to display.
      </div>
    );
  }

  return (
    <div
      className="h-[min(640px,70dvh)] min-h-[360px] overflow-hidden rounded-xl border border-border bg-card/40"
      // React Flow lays out left-to-right regardless of the page direction.
      dir="ltr"
    >
      <ReactFlow
        nodes={flowNodes}
        edges={initial.edges}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        nodesConnectable={false}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        minZoom={0.2}
        aria-label="Entity relationship graph"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} />
        <Controls showInteractive={false} />
        {nodes.length >= MINIMAP_MIN_NODES && <MiniMap pannable zoomable />}
      </ReactFlow>
    </div>
  );
}
