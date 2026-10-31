/**
 * Test-only stand-in for `@nestjs/typeorm`, which ships as ESM and can't be loaded by jest's CommonJS runtime.
 * The services under test only need the injection decorator, and the specs construct them by hand.
 *
 * Usage (must be in the spec itself so jest hoists it):
 *   jest.mock('@nestjs/typeorm', () =>
 *     jest.requireActual<typeof import('../testing/nestjs-typeorm.stub')>('../testing/nestjs-typeorm.stub'));
 */
export const InjectRepository = () => () => undefined;
export const InjectDataSource = () => () => undefined;
export const getRepositoryToken = (entity: unknown) => entity;
