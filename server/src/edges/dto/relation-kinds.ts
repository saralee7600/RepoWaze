import type { RelationKind } from '@repowaze/shared';

export const RELATION_KINDS = [
  'one-to-one',
  'one-to-many',
  'many-to-one',
  'many-to-many',
] as const satisfies readonly RelationKind[];
