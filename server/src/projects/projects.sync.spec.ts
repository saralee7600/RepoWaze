import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { DataSource, Repository } from 'typeorm';
import { EdgeEntity } from '../edges/edge.entity';
import { NodeEntity } from '../nodes/node.entity';
import type { EntityParserService } from './entity-parser.service';
import type { GithubService } from './github.service';
import type { ProjectAccessService } from './project-access.service';
import type { ProjectEntity } from './project.entity';
import { ProjectsService } from './projects.service';
import type { ParsedEntityGraph } from './parsed-entity.types';

jest.mock('@nestjs/typeorm', () =>
  jest.requireActual<typeof import('../testing/nestjs-typeorm.stub')>(
    '../testing/nestjs-typeorm.stub',
  ),
);
jest.mock('./github.service', () => ({ GithubService: class {} }));

const OWNER = 'user-a';
const REPO_URL = 'https://github.com/acme/shop';

const GRAPH: ParsedEntityGraph = {
  nodes: [
    {
      className: 'User',
      metadata: {
        tableName: 'user',
        filePath: 'user.entity.ts',
        columns: [],
        relations: [],
      },
    },
    {
      className: 'Order',
      metadata: {
        tableName: 'order',
        filePath: 'order.entity.ts',
        columns: [],
        relations: [],
      },
    },
  ],
  edges: [
    {
      sourceClass: 'Order',
      targetClass: 'User',
      relationType: 'many-to-one',
      label: 'user',
    },
  ],
};

function withSequentialIds(items: object[]): object[] {
  return items.map((item, index) => ({ ...item, id: index + 1 }));
}

function setup() {
  const repo = {
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    create: jest.fn((data: object) => data),
    save: jest.fn((data: object) => Promise.resolve(data)),
  };
  const access = { assertOwned: jest.fn().mockResolvedValue(undefined) };
  const github = {
    parseRepoUrl: jest.fn().mockReturnValue({ owner: 'acme', repo: 'shop' }),
    fetchEntityFiles: jest
      .fn()
      .mockResolvedValue([{ path: 'a.entity.ts', content: '' }]),
  };
  const parser = { parse: jest.fn().mockReturnValue(GRAPH) };

  const manager = {
    create: jest.fn((_type: unknown, data: object) => data),
    delete: jest.fn().mockResolvedValue(undefined),
    save: jest.fn((data: object | object[]) =>
      Promise.resolve(
        Array.isArray(data)
          ? withSequentialIds(data as object[])
          : { ...data, id: 10 },
      ),
    ),
  };
  const dataSource = {
    transaction: jest.fn(
      (work: (m: typeof manager) => Promise<unknown>): Promise<unknown> =>
        work(manager),
    ),
  };

  const service = new ProjectsService(
    repo as unknown as Repository<ProjectEntity>,
    dataSource as unknown as DataSource,
    github as unknown as GithubService,
    parser as unknown as EntityParserService,
    access as unknown as ProjectAccessService,
  );
  return { service, repo, access, github, parser, manager, dataSource };
}

describe('ProjectsService import de-duplication', () => {
  it('rejects a repository the caller already imported, before calling GitHub', async () => {
    const { service, repo, github } = setup();
    repo.findOne.mockResolvedValue({ id: 3, repoName: 'Shop' });

    await expect(
      service.importFromGithub({ repoUrl: 'acme/shop' }, OWNER),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { ownerId: OWNER, repoUrl: REPO_URL },
    });
    expect(github.fetchEntityFiles).not.toHaveBeenCalled();
  });

  it('imports a repository that is new for the caller', async () => {
    const { service, repo, manager } = setup();
    repo.findOne
      .mockResolvedValueOnce(null) // not imported yet
      .mockResolvedValueOnce({ id: 10 }); // loaded after saving

    const result = await service.importFromGithub(
      { repoUrl: 'acme/shop' },
      OWNER,
    );

    expect(result).toEqual({ id: 10 });
    expect(manager.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ repoUrl: REPO_URL, ownerId: OWNER }),
    );
  });
});

describe('ProjectsService.syncFromGithub', () => {
  it('replaces the nodes and edges of the callers project and keeps the project', async () => {
    const { service, repo, github, manager } = setup();
    repo.findOneOrFail.mockResolvedValue({ id: 7, repoUrl: REPO_URL });
    repo.findOne.mockResolvedValue({ id: 7 });

    const result = await service.syncFromGithub(7, OWNER);

    expect(repo.findOneOrFail).toHaveBeenCalledWith({
      where: { id: 7, ownerId: OWNER },
    });
    expect(github.parseRepoUrl).toHaveBeenCalledWith(REPO_URL);
    expect(manager.delete).toHaveBeenNthCalledWith(1, EdgeEntity, {
      projectId: 7,
    });
    expect(manager.delete).toHaveBeenNthCalledWith(2, NodeEntity, {
      projectId: 7,
    });
    expect(manager.create).toHaveBeenCalledWith(
      NodeEntity,
      expect.objectContaining({ projectId: 7, label: 'User' }),
    );
    expect(manager.create).toHaveBeenCalledWith(
      EdgeEntity,
      expect.objectContaining({
        projectId: 7,
        sourceNodeId: 2,
        targetNodeId: 1,
        relationType: 'many-to-one',
      }),
    );
    expect(result).toEqual({ id: 7 });
  });

  it('answers 404 and does nothing for a project the caller does not own', async () => {
    const { service, access, github, dataSource } = setup();
    access.assertOwned.mockRejectedValue(new NotFoundException());

    await expect(service.syncFromGithub(7, 'user-b')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(github.fetchEntityFiles).not.toHaveBeenCalled();
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it.each([
    ['no entity files remain', () => []],
    ['no @Entity classes remain', () => [{ path: 'x.entity.ts', content: '' }]],
  ])(
    'keeps the existing data when %s in the repository',
    async (_label, files) => {
      const { service, repo, github, parser, dataSource, manager } = setup();
      repo.findOneOrFail.mockResolvedValue({ id: 7, repoUrl: REPO_URL });
      github.fetchEntityFiles.mockResolvedValue(files());
      parser.parse.mockReturnValue({ nodes: [], edges: [] });

      await expect(service.syncFromGithub(7, OWNER)).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(manager.delete).not.toHaveBeenCalled();
    },
  );

  it('keeps the existing data when GitHub fails', async () => {
    const { service, repo, github, dataSource } = setup();
    repo.findOneOrFail.mockResolvedValue({ id: 7, repoUrl: REPO_URL });
    github.fetchEntityFiles.mockRejectedValue(new Error('GitHub is down'));

    await expect(service.syncFromGithub(7, OWNER)).rejects.toThrow(
      'GitHub is down',
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});
