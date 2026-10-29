import type { IEdge, IProject, INode } from '@repowaze/shared';

/**
 * What a shared interface looks like after a JSON round trip:
 * `Date` fields arrive as ISO-8601 strings.
 */
export type Serialized<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K];
};

/** Response of `POST /projects/import`: the saved project with its parsed graph. */
export type ImportProjectResponse = Serialized<IProject> & {
  nodes: INode[];
  edges: IEdge[];
};

/** Shape of the error body NestJS sends for `HttpException`s. */
export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
}
