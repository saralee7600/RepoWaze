import type { IProjectDetails, IProjectSummary } from '@repowaze/shared';

export type Serialized<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K];
};

export type ProjectSummary = Serialized<IProjectSummary>;

export type ProjectDetails = Serialized<IProjectDetails>;

export type ImportProjectResponse = ProjectDetails;

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
}
