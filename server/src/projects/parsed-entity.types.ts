import type { EntityNodeMetadata, RelationKind } from '@repowaze/shared';

export interface ParsedNode {
  className: string;
  metadata: EntityNodeMetadata;
}

export interface ParsedEdge {
  sourceClass: string;
  targetClass: string;
  relationType: RelationKind;
  label: string;
}

export interface ParsedEntityGraph {
  nodes: ParsedNode[];
  edges: ParsedEdge[];
}

export interface RawRelation {
  sourceClass: string;
  targetClass: string;
  propertyName: string;
  inverseProperty: string | null;
  relationType: RelationKind;
  isOwningSide: boolean;
}
