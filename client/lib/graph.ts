import type { EntityNodeMetadata, IEdge, INode } from '@repowaze/shared';

export function getEntityMetadata(node: INode): EntityNodeMetadata | null {
  const { metadata } = node;
  if (
    metadata === null ||
    typeof metadata.tableName !== 'string' ||
    typeof metadata.filePath !== 'string' ||
    !Array.isArray(metadata.columns) ||
    !Array.isArray(metadata.relations)
  ) {
    return null;
  }
  return metadata as EntityNodeMetadata;
}

export interface GraphLink {
  id: string;
  sourceNodeId: number;
  targetNodeId: number;
  properties: string[];
  relationTypes: string[];
}

export function toGraphLinks(nodes: readonly INode[], edges: readonly IEdge[]): GraphLink[] {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const links = new Map<string, GraphLink>();

  for (const edge of edges) {
    if (!nodeIds.has(edge.sourceNodeId) || !nodeIds.has(edge.targetNodeId)) continue;

    const key = `${edge.sourceNodeId}->${edge.targetNodeId}`;
    const link = links.get(key) ?? {
      id: `e${edge.sourceNodeId}-${edge.targetNodeId}`,
      sourceNodeId: edge.sourceNodeId,
      targetNodeId: edge.targetNodeId,
      properties: [],
      relationTypes: [],
    };
    if (edge.label && !link.properties.includes(edge.label)) link.properties.push(edge.label);
    if (!link.relationTypes.includes(edge.relationType)) link.relationTypes.push(edge.relationType);
    links.set(key, link);
  }

  return [...links.values()];
}

export interface Point {
  x: number;
  y: number;
}

export const NODE_WIDTH = 240;
const COLUMN_GAP = 240;
const ROW_GAP = 40;
const NODE_HEIGHT = 100;
const MAX_ROWS_PER_COLUMN = 8;

export function layoutLayers(
  nodes: readonly INode[],
  links: readonly GraphLink[],
): Map<number, Point> {
  const outgoing = new Map<number, number[]>(nodes.map((node) => [node.id, []]));
  for (const { sourceNodeId, targetNodeId } of links) {
    if (sourceNodeId !== targetNodeId) outgoing.get(sourceNodeId)?.push(targetNodeId);
  }

  const layerOf = new Map<number, number>();
  const visiting = new Set<number>();
  const depthOf = (id: number, layer: number): void => {
    if (visiting.has(id)) return;
    if ((layerOf.get(id) ?? -1) >= layer) return;
    layerOf.set(id, layer);
    visiting.add(id);
    for (const next of outgoing.get(id) ?? []) depthOf(next, layer + 1);
    visiting.delete(id);
  };

  const hasIncoming = new Set(links.filter((l) => l.sourceNodeId !== l.targetNodeId).map((l) => l.targetNodeId));
  const roots = nodes.filter((node) => !hasIncoming.has(node.id));
  for (const root of roots.length > 0 ? roots : nodes.slice(0, 1)) depthOf(root.id, 0);
  for (const node of nodes) if (!layerOf.has(node.id)) depthOf(node.id, 0);

  const layers: INode[][] = [];
  for (const node of nodes) {
    const layer = layerOf.get(node.id) ?? 0;
    (layers[layer] ??= []).push(node);
  }

  const positions = new Map<number, Point>();
  let x = 0;
  layers.forEach((layer, layerIndex) => {
    if (!layer) return;
    const stagger = layerIndex % 2 === 0 ? 0 : (NODE_HEIGHT + ROW_GAP) / 2;
    const columns = Math.ceil(layer.length / MAX_ROWS_PER_COLUMN);
    const rows = Math.ceil(layer.length / columns);
    layer.forEach((node, index) => {
      const column = Math.floor(index / rows);
      const row = index % rows;
      const inColumn = Math.min(rows, layer.length - column * rows);
      positions.set(node.id, {
        x: x + column * (NODE_WIDTH + COLUMN_GAP / 2),
        y: (row - (inColumn - 1) / 2) * (NODE_HEIGHT + ROW_GAP) + stagger,
      });
    });
    x += columns * (NODE_WIDTH + COLUMN_GAP / 2) + COLUMN_GAP / 2;
  });
  return positions;
}
