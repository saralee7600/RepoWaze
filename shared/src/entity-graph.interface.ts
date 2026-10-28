/** TypeORM relation kinds recognised by the importer; stored in `IEdge.relationType`. */
export type RelationKind =
  | 'one-to-one'
  | 'one-to-many'
  | 'many-to-one'
  | 'many-to-many';

/** A column / property declared on a TypeORM entity class. */
export interface IEntityColumn {
  propertyName: string;
  columnName: string;
  /** Database type (explicit from the decorator, otherwise inferred from the TS type). */
  type: string;
  /** The raw TypeScript type annotation, if one was declared. */
  tsType: string | null;
  nullable: boolean;
  primary: boolean;
  generated: boolean;
}

/** A relation declared on a TypeORM entity class (as written in that class). */
export interface IEntityRelation {
  propertyName: string;
  /** Class name of the related entity. */
  target: string;
  relationType: RelationKind;
  /** Property on the target that points back, when declared. */
  inverseProperty: string | null;
}

/**
 * Shape of `INode.metadata` for nodes created by the GitHub import.
 * Declared as a type alias (not an interface) so it stays assignable to
 * `Record<string, unknown>`.
 */
export type EntityNodeMetadata = {
  tableName: string;
  filePath: string;
  columns: IEntityColumn[];
  relations: IEntityRelation[];
};

/** Request body of `POST /projects/import`. */
export interface IImportProjectRequest {
  repoUrl: string;
  name?: string;
}
