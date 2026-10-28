import type { EdgeItem, NodeItem, Project, RelationType } from '@/types/project';

/**
 * Phase 1 placeholder data. Replaced by `GET /projects` once the API
 * client lands; shaped exactly like the real payload so the UI won't change.
 */

const RELATION_CYCLE: readonly RelationType[] = [
  'many-to-one',
  'one-to-many',
  'one-to-one',
  'many-to-many',
];

function buildProject(
  id: number,
  repoName: string,
  repoUrl: string,
  createdAt: string,
  nodeCount: number,
  edgeCount: number,
): Project {
  const nodes: NodeItem[] = Array.from({ length: nodeCount }, (_, i) => ({
    id: id * 1000 + i + 1,
    projectId: id,
    label: `Entity${i + 1}`,
    type: 'entity',
    metadata: null,
  }));

  const edges: EdgeItem[] = Array.from({ length: edgeCount }, (_, i) => ({
    id: id * 1000 + i + 1,
    projectId: id,
    sourceNodeId: nodes[i % nodeCount].id,
    targetNodeId: nodes[(i + 1) % nodeCount].id,
    relationType: RELATION_CYCLE[i % RELATION_CYCLE.length],
    label: null,
  }));

  return { id, repoName, repoUrl, createdAt, nodes, edges };
}

export const MOCK_PROJECTS: Project[] = [
  buildProject(1, 'RepoWaze', 'https://github.com/acme/repowaze', '2026-10-27T16:42:00.000Z', 3, 3),
  buildProject(2, 'shop-backend', 'https://github.com/acme/shop-backend', '2026-10-20T09:15:00.000Z', 14, 21),
  buildProject(3, 'blog-api', 'https://github.com/jdoe/blog-api', '2026-09-30T12:00:00.000Z', 6, 7),
  buildProject(4, 'inventory-service', 'https://github.com/acme/inventory-service', '2026-09-12T18:30:00.000Z', 22, 35),
];
