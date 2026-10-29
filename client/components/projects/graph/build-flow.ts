import { MarkerType, type Edge } from '@xyflow/react';
import type { IEdge, INode } from '@repowaze/shared';
import { getEntityMetadata, layoutLayers, toGraphLinks } from '@/lib/graph';
import type { EntityFlowNode } from './EntityNode';

export interface FlowGraph {
  nodes: EntityFlowNode[];
  edges: Edge[];
}

/** Converts a project's persisted nodes and edges into React Flow's nodes and edges. */
export function buildFlowGraph(nodes: readonly INode[], edges: readonly IEdge[]): FlowGraph {
  const links = toGraphLinks(nodes, edges);
  const positions = layoutLayers(nodes, links);

  const flowNodes = nodes.map<EntityFlowNode>((node) => {
    const metadata = getEntityMetadata(node);
    return {
      id: String(node.id),
      type: 'entity',
      position: positions.get(node.id) ?? { x: 0, y: 0 },
      data: {
        label: node.label,
        tableName: metadata?.tableName ?? null,
        columnCount: metadata?.columns.length ?? 0,
        relationCount: metadata?.relations.length ?? 0,
      },
    };
  });

  const flowEdges = links.map<Edge>((link) => {
    const kinds = link.relationTypes.join(' / ');
    return {
      id: link.id,
      source: String(link.sourceNodeId),
      target: String(link.targetNodeId),
      type: 'smoothstep',
      label: link.properties.length > 0 ? `${link.properties.join(', ')} · ${kinds}` : kinds,
      markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
    };
  });

  return { nodes: flowNodes, edges: flowEdges };
}
