export interface INode {
  id: number;
  projectId: number;
  label: string;
  type: string;
  metadata: Record<string, unknown> | null;
}
