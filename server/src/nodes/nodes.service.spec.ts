import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { ProjectAccessService } from '../projects/project-access.service';
import type { NodeEntity } from './node.entity';
import { NodesService } from './nodes.service';

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
  const access = { assertOwned: jest.fn().mockResolvedValue(undefined) };
  const service = new NodesService(
    repo as unknown as Repository<NodeEntity>,
    access as unknown as ProjectAccessService,
  );
  return { service, repo, access };
}

describe('NodesService ownership', () => {
  it('lists only nodes of projects the caller owns', async () => {
    const { service, repo } = setup();

    await service.findAll(OWNER);

    expect(repo.find).toHaveBeenCalledWith({
      where: { project: { ownerId: OWNER } },
    });
  });

  it('verifies project ownership before listing by projectId (404 for foreign projects)', async () => {
    const { service, repo, access } = setup();
    access.assertOwned.mockRejectedValue(new NotFoundException());

    await expect(service.findAll(OTHER, 4)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repo.find).not.toHaveBeenCalled();
  });

  it('throws 404 for a node whose project belongs to someone else', async () => {
    const { service, repo } = setup();
    repo.findOne.mockResolvedValue(null);

    await expect(service.findOne(9, OTHER)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 9, project: { ownerId: OTHER } },
    });
  });

  describe('create', () => {
    it('requires a projectId', async () => {
      const { service } = setup();

      await expect(
        service.create(OWNER, { label: 'x' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses to add a node to a project the caller does not own', async () => {
      const { service, repo, access } = setup();
      access.assertOwned.mockRejectedValue(new NotFoundException());

      await expect(
        service.create(OTHER, { projectId: 4, label: 'x', type: 'entity' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('ignores a client-supplied id', async () => {
      const { service, repo } = setup();

      await service.create(OWNER, {
        id: 77,
        projectId: 4,
        label: 'User',
        type: 'entity',
      });

      expect(repo.create).toHaveBeenCalledWith({
        projectId: 4,
        label: 'User',
        type: 'entity',
      });
    });
  });

  describe('update', () => {
    it('refuses to move a node into a project the caller does not own', async () => {
      const { service, repo, access } = setup();
      repo.findOne.mockResolvedValue({ id: 1, projectId: 4 });
      access.assertOwned.mockRejectedValue(new NotFoundException());

      await expect(
        service.update(1, OWNER, { projectId: 99 }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(access.assertOwned).toHaveBeenCalledWith(99, OWNER);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('updates an owned node with whitelisted columns only', async () => {
      const { service, repo } = setup();
      repo.findOne.mockResolvedValue({ id: 1, projectId: 4 });

      await service.update(1, OWNER, { label: 'Renamed', id: 5 });

      expect(repo.update).toHaveBeenCalledWith(1, { label: 'Renamed' });
    });
  });

  describe('delete', () => {
    it('deletes an owned node', async () => {
      const { service, repo } = setup();
      repo.findOne.mockResolvedValue({ id: 1, projectId: 4 });

      await service.delete(1, OWNER);

      expect(repo.delete).toHaveBeenCalledWith(1);
    });

    it('answers 404 and deletes nothing for a foreign node', async () => {
      const { service, repo } = setup();
      repo.findOne.mockResolvedValue(null);

      await expect(service.delete(1, OTHER)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.delete).not.toHaveBeenCalled();
    });
  });
});
