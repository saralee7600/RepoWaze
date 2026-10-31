export type RelationKind =
  | 'one-to-one'
  | 'one-to-many'
  | 'many-to-one'
  | 'many-to-many';

export interface IEntityColumn {
  propertyName: string;
  columnName: string;
  type: string;
  tsType: string | null;
  nullable: boolean;
  primary: boolean;
  generated: boolean;
}

export interface IEntityRelation {
  propertyName: string;
  target: string;
  relationType: RelationKind;
  inverseProperty: string | null;
}

export type EntityNodeMetadata = {
  tableName: string;
  filePath: string;
  columns: IEntityColumn[];
  relations: IEntityRelation[];
};

export interface IImportProjectRequest {
  repoUrl: string;
  name?: string;
}
