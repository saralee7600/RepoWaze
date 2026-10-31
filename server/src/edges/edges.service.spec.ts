import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { NodeEntity } from '../nodes/node.entity';
import type { ProjectAccessService } from '../projects/project-access.service';
import type { EdgeEntity } from './edge.entity';
import { EdgesService } from './edges.service';

jest.mock('@nestjs/typeorm', () =>
  jest.requireActual<typeof import('../testing/nestjs-typeorm.stub')>(
    '../testing/nestjs-typeorm.stub',
  ),
);

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
  const nodes = { count: jest.fn().mockResolvedValue(2) };
  const access = { assertOwned: jest.fn().mockResolvedValue(undefined) };
  const service = new EdgesService(
    repo as unknown as Repository<EdgeEntity>,
    nodes as unknown as Repository<NodeEntity>,
    access as unknown as ProjectAccessService,
  );
  return { service, repo, nodes, access };
}

describe('EdgesService ownership', () => {
  it('lists only edges of projects the caller owns', async () => {
    const { service, repo } = setup();

    await service.findAll(OWNER);

    expect(repo.find).toHaveBeenCalledWith({
      where: { project: { ownerId: OWNER } },
    });
  });

  it('throws 404 for an edge whose project belongs to someone else', async () => {
    const { service, repo } = setup();
    repo.findOne.mockResolvedValue(null);

    await expect(service.findOne(3, OTHER)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 3, project: { ownerId: OTHER } },
    });
  });

  describe('create', () => {
    const body = {
      projectId: 4,
      sourceNodeId: 10,
      targetNodeId: 11,
      relationType: 'one-to-many',
    };

    it('creates an edge between two nodes of an owned project', async () => {
      const { service, repo, access } = setup();

      await service.create(OWNER, { ...body, id: 77 });

      expect(access.assertOwned).toHaveBeenCalledWith(4, OWNER);
      expect(repo.create).toHaveBeenCalledWith(body);
    });

    it('requires projectId and both node ids', async () => {
      const { service } = setup();

      await expect(
        service.create(OWNER, { projectId: 4 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses to add an edge to a project the caller does not own', async () => {
      const { service, repo, access } = setup();
      access.assertOwned.mockRejectedValue(new NotFoundException());

      await expect(service.create(OTHER, body)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('refuses to connect nodes that belong to another project', async () => {
      const { service, repo, nodes } = setup();
      nodes.count.mockResolvedValue(1);

      await expect(service.create(OWNER, body)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates an owned edge with whitelisted columns only', async () => {
      const { service, repo } = setup();
      repo.findOne.mockResolvedValue({
        id: 1,
        projectId: 4,
        sourceNodeId: 10,
        targetNodeId: 11,
      });

      await service.update(1, OWNER, { label: 'owns', id: 9 });

      expect(repo.update).toHaveBeenCalledWith(1, { label: 'owns' });
    });

    it('refuses to move an edge into a project the caller does not own', async () => {
      const { service, repo, access } = setup();
      repo.findOne.mockResolvedValue({
        id: 1,
        projectId: 4,
        sourceNodeId: 10,
        targetNodeId: 11,
      });
      access.assertOwned.mockRejectedValue(new NotFoundException());

      await expect(
        service.update(1, OWNER, { projectId: 99 }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('deletes an owned edge', async () => {
      const { service, repo } = setup();
      repo.findOne.mockResolvedValue({ id: 1 });

      await service.delete(1, OWNER);

      expect(repo.delete).toHaveBeenCalledWith(1);
    });

    it('answers 404 and deletes nothing for a foreign edge', async () => {
      const { service, repo } = setup();
      repo.findOne.mockResolvedValue(null);

      await expect(service.delete(1, OTHER)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.delete).not.toHaveBeenCalled();
    });
  });
});
