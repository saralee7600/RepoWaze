import { join } from 'node:path';
import type { DataSourceOptions } from 'typeorm';

/** Reads a single environment value, e.g. `ConfigService#get` or `process.env`. */
export type EnvReader = (key: string) => string | undefined;

const DEFAULT_MYSQL_PORT = 3306;

// Paths are resolved from this file's own location, so they are independent of
// the working directory and work from `src` (ts-node / nest start) as well as
// from the compiled `dist`. Only one extension is globbed per environment so
// that compiled `.d.ts` / `.js.map` files are never loaded as entities or
// migrations.
const SRC_ROOT = join(__dirname, '..');
const EXTENSION = __filename.endsWith('.ts') ? 'ts' : 'js';

/**
 * Single source of truth for the TypeORM connection, entities and migrations.
 * Used by both the Nest application (`TypeOrmModule.forRootAsync`) and the
 * TypeORM CLI (`typeorm.config.ts`).
 */
export function buildDatabaseOptions(read: EnvReader): DataSourceOptions {
  return {
    type: 'mysql',
    host: read('DB_HOST'),
    port: Number(read('DB_PORT') ?? DEFAULT_MYSQL_PORT),
    username: read('DB_USER'),
    password: read('DB_PASS'),
    database: read('DB_NAME'),
    entities: [join(SRC_ROOT, '**', `*.entity.${EXTENSION}`)],
    migrations: [join(SRC_ROOT, 'migrations', `*.${EXTENSION}`)],
    synchronize: false,
  };
}
