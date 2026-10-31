import { Injectable, Logger } from '@nestjs/common';
import * as ts from 'typescript';
import type {
  IEntityColumn,
  IEntityRelation,
  RelationKind,
} from '@repowaze/shared';
import type { RepositoryFile } from './github.types';
import type {
  ParsedEdge,
  ParsedEntityGraph,
  ParsedNode,
  RawRelation,
} from './parsed-entity.types';
import {
  findOptionsObject,
  getDecorators,
  getOption,
  readBoolean,
  readInverseProperty,
  readRelationTarget,
  readString,
  readTypeExpression,
  toSnakeCase,
  unwrapEntityTypeName,
  type DecoratorInfo,
} from './entity-ast.helpers';

const RELATION_DECORATORS: Readonly<Record<string, RelationKind>> = {
  OneToOne: 'one-to-one',
  OneToMany: 'one-to-many',
  ManyToOne: 'many-to-one',
  ManyToMany: 'many-to-many',
};

const COLUMN_DECORATORS: Readonly<Record<string, string | null>> = {
  Column: null,
  PrimaryColumn: null,
  PrimaryGeneratedColumn: 'int',
  CreateDateColumn: 'datetime',
  UpdateDateColumn: 'datetime',
  DeleteDateColumn: 'datetime',
  VersionColumn: 'int',
};

const PRIMARY_DECORATORS = new Set(['PrimaryColumn', 'PrimaryGeneratedColumn']);

const TS_TO_DB_TYPE: Readonly<Record<string, string>> = {
  string: 'varchar',
  number: 'int',
  boolean: 'boolean',
  Date: 'datetime',
};

const CONSTRUCTOR_TO_DB_TYPE: Readonly<Record<string, string>> = {
  String: 'varchar',
  Number: 'int',
  Boolean: 'boolean',
  Date: 'datetime',
};

interface ParsedClass {
  node: ParsedNode;
  relations: RawRelation[];
}

@Injectable()
export class EntityParserService {
  private readonly logger = new Logger(EntityParserService.name);

  parse(files: readonly RepositoryFile[]): ParsedEntityGraph {
    const nodes = new Map<string, ParsedNode>();
    const relations: RawRelation[] = [];

    for (const file of files) {
      for (const parsed of this.parseFile(file)) {
        const { className } = parsed.node;
        if (nodes.has(className)) {
          this.logger.warn(
            `Duplicate entity class "${className}" in ${file.path}; keeping the first occurrence`,
          );
          continue;
        }
        nodes.set(className, parsed.node);
        relations.push(...parsed.relations);
      }
    }

    return {
      nodes: [...nodes.values()],
      edges: this.buildEdges(relations, nodes),
    };
  }

  private parseFile(file: RepositoryFile): ParsedClass[] {
    const sourceFile = ts.createSourceFile(
      file.path,
      file.content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );

    const result: ParsedClass[] = [];
    for (const statement of sourceFile.statements) {
      if (!ts.isClassDeclaration(statement) || !statement.name) continue;

      const entityDecorator = getDecorators(statement).find(
        (d) => d.name === 'Entity',
      );
      if (!entityDecorator) continue;

      result.push(
        this.parseClass(
          statement,
          statement.name.text,
          entityDecorator,
          file,
          sourceFile,
        ),
      );
    }
    return result;
  }

  private parseClass(
    declaration: ts.ClassDeclaration,
    className: string,
    entityDecorator: DecoratorInfo,
    file: RepositoryFile,
    sourceFile: ts.SourceFile,
  ): ParsedClass {
    const columns: IEntityColumn[] = [];
    const relations: RawRelation[] = [];
    const declaredRelations: IEntityRelation[] = [];

    for (const member of declaration.members) {
      if (!ts.isPropertyDeclaration(member)) continue;
      if (!ts.isIdentifier(member.name) && !ts.isStringLiteral(member.name))
        continue;

      const propertyName = member.name.text;
      const decorators = getDecorators(member);
      const tsType = member.type ? member.type.getText(sourceFile) : null;

      const relationDecorator = decorators.find(
        (d) => d.name in RELATION_DECORATORS,
      );
      if (relationDecorator) {
        const relation = this.parseRelation(
          className,
          propertyName,
          relationDecorator,
          decorators,
          tsType,
        );
        if (relation) {
          relations.push(relation);
          declaredRelations.push({
            propertyName,
            target: relation.targetClass,
            relationType: relation.relationType,
            inverseProperty: relation.inverseProperty,
          });
        } else {
          this.logger.warn(
            `Could not resolve relation target of ${className}.${propertyName} (${file.path})`,
          );
        }
        continue;
      }

      const columnDecorator = decorators.find(
        (d) => d.name in COLUMN_DECORATORS,
      );
      if (columnDecorator) {
        columns.push(
          this.parseColumn(propertyName, columnDecorator, tsType, sourceFile),
        );
      }
    }

    return {
      node: {
        className,
        metadata: {
          tableName: this.readTableName(entityDecorator, className),
          filePath: file.path,
          columns,
          relations: declaredRelations,
        },
      },
      relations,
    };
  }

  private readTableName(decorator: DecoratorInfo, className: string): string {
    const explicit =
      readString(decorator.args[0]) ??
      readString(getOption(findOptionsObject(decorator.args), 'name'));
    return explicit ?? toSnakeCase(className);
  }

  private parseColumn(
    propertyName: string,
    decorator: DecoratorInfo,
    tsType: string | null,
    sourceFile: ts.SourceFile,
  ): IEntityColumn {
    const options = findOptionsObject(decorator.args);
    const isGenerated = decorator.name === 'PrimaryGeneratedColumn';

    const firstArg = decorator.args[0];
    const typeExpression =
      getOption(options, 'type') ??
      (firstArg === options ? undefined : firstArg);
    const explicitType = readTypeExpression(typeExpression, sourceFile);

    return {
      propertyName,
      columnName: readString(getOption(options, 'name')) ?? propertyName,
      type: this.resolveColumnType(decorator.name, explicitType, tsType),
      tsType,
      nullable:
        readBoolean(getOption(options, 'nullable')) ??
        this.isNullableType(tsType),
      primary:
        PRIMARY_DECORATORS.has(decorator.name) ||
        readBoolean(getOption(options, 'primary')) === true,
      generated: isGenerated || getOption(options, 'generated') !== undefined,
    };
  }

  private resolveColumnType(
    decoratorName: string,
    explicitType: string | null,
    tsType: string | null,
  ): string {
    if (decoratorName === 'PrimaryGeneratedColumn') {
      return explicitType === 'uuid' || explicitType === 'rowid'
        ? 'uuid'
        : (explicitType ?? 'int');
    }
    if (explicitType) {
      return CONSTRUCTOR_TO_DB_TYPE[explicitType] ?? explicitType;
    }
    const implied = COLUMN_DECORATORS[decoratorName];
    if (implied) return implied;

    const baseType = tsType?.replace(/\s*\|\s*(null|undefined)\b/g, '').trim();
    return (baseType && TS_TO_DB_TYPE[baseType]) || baseType || 'unknown';
  }

  private isNullableType(tsType: string | null): boolean {
    return tsType !== null && /\b(null|undefined)\b/.test(tsType);
  }

  private parseRelation(
    sourceClass: string,
    propertyName: string,
    decorator: DecoratorInfo,
    allDecorators: readonly DecoratorInfo[],
    tsType: string | null,
  ): RawRelation | null {
    const relationType = RELATION_DECORATORS[decorator.name];
    const targetClass =
      readRelationTarget(decorator.args[0]) ?? unwrapEntityTypeName(tsType);
    if (!targetClass) return null;

    const hasJoin = allDecorators.some(
      (d) => d.name === 'JoinColumn' || d.name === 'JoinTable',
    );
    return {
      sourceClass,
      targetClass,
      propertyName,
      inverseProperty: readInverseProperty(decorator.args[1]),
      relationType,
      isOwningSide: relationType === 'many-to-one' || hasJoin,
    };
  }

  private buildEdges(
    relations: readonly RawRelation[],
    nodes: ReadonlyMap<string, ParsedNode>,
  ): ParsedEdge[] {
    const claimedBy = new Map<string, string>();
    for (const r of relations) {
      if (r.inverseProperty) {
        claimedBy.set(
          `${r.targetClass}.${r.inverseProperty}`,
          `${r.sourceClass}.${r.propertyName}`,
        );
      }
    }

    const unique = new Map<string, RawRelation>();
    for (const relation of relations) {
      if (!nodes.has(relation.targetClass)) {
        this.logger.warn(
          `Skipping ${relation.sourceClass}.${relation.propertyName}: target entity "${relation.targetClass}" was not found among the imported files`,
        );
        continue;
      }

      const own = `${relation.sourceClass}.${relation.propertyName}`;
      const other = relation.inverseProperty
        ? `${relation.targetClass}.${relation.inverseProperty}`
        : claimedBy.get(own);
      const key = other ? [own, other].sort().join('|') : own;

      const existing = unique.get(key);
      if (!existing || (relation.isOwningSide && !existing.isOwningSide)) {
        unique.set(key, relation);
      }
    }

    return [...unique.values()].map((r) => ({
      sourceClass: r.sourceClass,
      targetClass: r.targetClass,
      relationType: r.relationType,
      label: r.propertyName,
    }));
  }
}
