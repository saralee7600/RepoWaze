import type { IEdge } from './edge.interface';
import type { INode } from './node.interface';
import type { IProject } from './project.interface';

/** A project with aggregate graph sizes. Served by `GET /projects` (one entry per project). */
export interface IProjectSummary extends IProject {
  nodeCount: number;
  edgeCount: number;
}

/** A project with its full graph. Served by `GET /projects/:id` and `POST /projects/import`. */
export interface IProjectDetails extends IProject {
  nodes: INode[];
  edges: IEdge[];
}
