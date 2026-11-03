import { existsSync } from 'node:fs';
import { DataSource } from 'typeorm';
import { buildDatabaseOptions } from './database.config';

// Entry point for the TypeORM CLI only (see the `migration:*` npm scripts).
// Locally the values come from `.env`; in production (e.g. Render) there is no
// `.env` file and the variables are already present in the environment.
// `loadEnvFile` never overrides variables that are already set.
if (existsSync('.env')) process.loadEnvFile();

export default new DataSource(buildDatabaseOptions((key) => process.env[key]));
