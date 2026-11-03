import type { EntityManager } from 'typeorm';
import { EdgeEntity } from '../edges/edge.entity';
import { NodeEntity } from '../nodes/node.entity';
import type { GithubRepoRef } from './github.types';
import type { ParsedEntityGraph } from './parsed-entity.types';

/** Canonical URL stored for an imported repository. */
export function toRepoUrl(ref: GithubRepoRef): string {
  return `https://github.com/${ref.owner}/${ref.repo}`;
}

/**
 * Writes the nodes and edges of a parsed graph for an existing project.
 * Must be called inside a transaction (`manager` belongs to it).
 */
export async function saveGraph(
  manager: EntityManager,
  projectId: number,
  graph: ParsedEntityGraph,
): Promise<void> {
  const nodes = await manager.save(
    graph.nodes.map((node) =>
      manager.create(NodeEntity, {
        projectId,
        label: node.className,
        type: 'entity',
        metadata: node.metadata,
      }),
    ),
  );

  const nodeIdByClass = new Map<string, number>();
  nodes.forEach((saved, index) => {
    nodeIdByClass.set(graph.nodes[index].className, saved.id);
  });

  const edges = graph.edges.flatMap((edge) => {
    const sourceNodeId = nodeIdByClass.get(edge.sourceClass);
    const targetNodeId = nodeIdByClass.get(edge.targetClass);
    if (sourceNodeId === undefined || targetNodeId === undefined) return [];

    return manager.create(EdgeEntity, {
      projectId,
      sourceNodeId,
      targetNodeId,
      relationType: edge.relationType,
      label: edge.label,
    });
  });
  await manager.save(edges);
}
