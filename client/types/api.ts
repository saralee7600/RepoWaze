import type { IProjectDetails, IProjectSummary } from '@repowaze/shared';

/**
 * What a shared interface looks like after a JSON round trip:
 * `Date` fields arrive as ISO-8601 strings.
 */
export type Serialized<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K];
};

/** One entry of `GET /projects`: a project with its node and edge counts. */
export type ProjectSummary = Serialized<IProjectSummary>;

/** Response of `GET /projects/:id`: a project with its full graph. */
export type ProjectDetails = Serialized<IProjectDetails>;

/** Response of `POST /projects/import`: the saved project with its parsed graph. */
export type ImportProjectResponse = ProjectDetails;

/** Shape of the error body NestJS sends for `HttpException`s. */
export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
}
