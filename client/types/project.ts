/**
 * Client-side domain types for the AST Inspector.
 *
 * These mirror the REST payloads served by the NestJS API. Dates arrive as
 * ISO-8601 strings over JSON, so `createdAt` is a `string` here (the server
 * entity uses `Date`).
 */

/** Kind of element a graph node represents. */
export type NodeType = 'entity' | 'model' | 'service';

/** Cardinality of a relation between two nodes. */
export type RelationType =
  | 'many-to-one'
  | 'one-to-many'
  | 'one-to-one'
  | 'many-to-many';

/** A column / property declared on an entity class. */
export interface ColumnMetadata {
  propertyName: string;
  columnName: string;
  /** Database type (explicit from the decorator, otherwise inferred). */
  type: string;
  /** Raw TypeScript type annotation, when one was declared. */
  tsType: string | null;
  nullable: boolean;
  primary: boolean;
  generated: boolean;
}

/** A relation declared on an entity class, as written in that class. */
export interface RelationMetadata {
  propertyName: string;
  /** Class name of the related entity. */
  target: string;
  relationType: RelationType;
  /** Property on the target that points back, when declared. */
  inverseProperty: string | null;
}

/** Parsed details attached to a node. */
export interface NodeMetadata {
  tableName: string;
  filePath: string;
  columns: ColumnMetadata[];
  relations: RelationMetadata[];
}

/** A node in a project's graph (e.g. one entity class). */
export interface NodeItem {
  id: number;
  projectId: number;
  label: string;
  type: NodeType;
  metadata: NodeMetadata | null;
}

/** A directed edge between two nodes of the same project. */
export interface EdgeItem {
  id: number;
  projectId: number;
  sourceNodeId: number;
  targetNodeId: number;
  relationType: RelationType;
  label: string | null;
}

/** An imported repository together with its parsed graph. */
export interface Project {
  id: number;
  repoName: string;
  repoUrl: string;
  /** ISO-8601 timestamp. */
  createdAt: string;
  nodes: NodeItem[];
  edges: EdgeItem[];
}
