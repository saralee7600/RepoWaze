import { join } from 'node:path';
import type { DataSourceOptions } from 'typeorm';

/** Reads a single environment value, e.g. `ConfigService#get` or `process.env`. */
export type EnvReader = (key: string) => string | undefined;

const DEFAULT_MYSQL_PORT = 3306;


const SRC_ROOT = join(__dirname, '..');
const EXTENSION = __filename.endsWith('.ts') ? 'ts' : 'js';


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
