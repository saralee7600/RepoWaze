export interface IEdge {
  id: number;
  projectId: number;
  sourceNodeId: number;
  targetNodeId: number;
  relationType: string;
  label: string | null;
}
