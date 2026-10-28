import type {
  EntityNodeMetadata,
  RelationKind,
} from '@repowaze/shared';

/** A node of the architecture graph: one TypeORM entity (table). */
export interface ParsedNode {
  /** Entity class name; unique within a parsed graph and used to link edges. */
  className: string;
  metadata: EntityNodeMetadata;
}

/** An edge of the architecture graph: one relation between two entities. */
export interface ParsedEdge {
  sourceClass: string;
  targetClass: string;
  relationType: RelationKind;
  /** The relation property name on the source class. */
  label: string;
}

/** Result of statically analysing a set of entity files. */
export interface ParsedEntityGraph {
  nodes: ParsedNode[];
  edges: ParsedEdge[];
}

/**
 * A relation exactly as declared in source, before it is resolved against the
 * other entities and de-duplicated.
 */
export interface RawRelation {
  sourceClass: string;
  targetClass: string;
  propertyName: string;
  inverseProperty: string | null;
  relationType: RelationKind;
  /** True when this side holds the foreign key / join table. */
  isOwningSide: boolean;
}
