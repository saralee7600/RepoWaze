import { NotFoundException } from '@nestjs/common';
import type { DataSource, Repository } from 'typeorm';
import type { EntityParserService } from './entity-parser.service';
import type { ProjectAccessService } from './project-access.service';
import type { ProjectEntity } from './project.entity';
import { ProjectsService } from './projects.service';

jest.mock('@nestjs/typeorm', () =>
  jest.requireActual<typeof import('../testing/nestjs-typeorm.stub')>(
    '../testing/nestjs-typeorm.stub',
  ),
);
jest.mock('./github.service', () => ({ GithubService: class {} }));

const OWNER = 'user-a';
const OTHER = 'user-b';

function setup() {
  const repo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
    create: jest.fn((data: object) => data),
    save: jest.fn((data: object) => Promise.resolve(data)),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
  };
  const access = {
    assertOwned: jest.fn().mockResolvedValue(undefined),
  };
  const queryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
  };
  const dataSource = {
    getRepository: jest
      .fn()
      .mockReturnValue({ createQueryBuilder: () => queryBuilder }),
  };

  const service = new ProjectsService(
    repo as unknown as Repository<ProjectEntity>,
    dataSource as unknown as DataSource,
    {} as never,
    {} as EntityParserService,
    access as unknown as ProjectAccessService,
  );
  return { service, repo, access, queryBuilder };
}

describe('ProjectsService ownership', () => {
  describe('findAll', () => {
    it('lists only the caller’s projects and counts only their nodes and edges', async () => {
      const { service, repo, queryBuilder } = setup();
      repo.find.mockResolvedValue([
        { id: 1, repoUrl: 'u', repoName: 'n', createdAt: new Date() },
      ]);
      queryBuilder.getRawMany.mockResolvedValue([
        { projectId: '1', total: '4' },
      ]);

      const result = await service.findAll(OWNER);

      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { ownerId: OWNER } }),
      );
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'project.ownerId = :ownerId',
        { ownerId: OWNER },
      );
      expect(result).toEqual([
        expect.objectContaining({ id: 1, nodeCount: 4, edgeCount: 4 }),
      ]);
    });
  });

  describe('findOne', () => {
    it('looks the project up by id AND owner', async () => {
      const { service, repo } = setup();
      repo.findOne.mockResolvedValue({ id: 5 });

      await service.findOne(5, OWNER);

      expect(repo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 5, ownerId: OWNER } }),
      );
    });

    it('throws 404 for a project that is not the caller’s', async () => {
      const { service, repo } = setup();
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne(5, OTHER)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('stamps the caller as owner and ignores any ownerId/id in the body', async () => {
      const { service, repo } = setup();

      await service.create(OWNER, {
        id: 99,
        repoUrl: 'https://github.com/a/b',
        repoName: 'a/b',
        ownerId: OTHER,
      } as never);

      expect(repo.create).toHaveBeenCalledWith({
        repoUrl: 'https://github.com/a/b',
        repoName: 'a/b',
        ownerId: OWNER,
      });
    });
  });

  describe('update', () => {
    it('checks ownership first and only writes whitelisted columns for that owner', async () => {
      const { service, repo, access } = setup();
      repo.findOne.mockResolvedValue({ id: 3 });

      await service.update(3, OWNER, {
        repoName: 'renamed',
        ownerId: OTHER,
      } as never);

      expect(access.assertOwned).toHaveBeenCalledWith(3, OWNER);
      expect(repo.update).toHaveBeenCalledWith(
        { id: 3, ownerId: OWNER },
        { repoName: 'renamed' },
      );
    });

    it('does not touch the project when the caller does not own it', async () => {
      const { service, repo, access } = setup();
      access.assertOwned.mockRejectedValue(new NotFoundException());

      await expect(
        service.update(3, OTHER, { repoName: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('deletes the caller’s project by id AND owner', async () => {
      const { service, repo, access } = setup();

      await expect(service.delete(8, OWNER)).resolves.toBeUndefined();

      expect(access.assertOwned).toHaveBeenCalledWith(8, OWNER);
      expect(repo.delete).toHaveBeenCalledWith({ id: 8, ownerId: OWNER });
    });

    it('answers 404 and deletes nothing for someone else’s project', async () => {
      const { service, repo, access } = setup();
      access.assertOwned.mockRejectedValue(new NotFoundException());

      await expect(service.delete(8, OTHER)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.delete).not.toHaveBeenCalled();
    });
  });
});
