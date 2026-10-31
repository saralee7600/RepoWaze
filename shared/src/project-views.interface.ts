import type { IEdge } from './edge.interface';
import type { INode } from './node.interface';
import type { IProject } from './project.interface';

export interface IProjectSummary extends IProject {
  nodeCount: number;
  edgeCount: number;
}

export interface IProjectDetails extends IProject {
  nodes: INode[];
  edges: IEdge[];
}
