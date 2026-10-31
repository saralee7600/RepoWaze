import { NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { ProjectAccessService } from './project-access.service';
import type { ProjectEntity } from './project.entity';

// `@nestjs/typeorm` is ESM-only; see the stub for details.
jest.mock('@nestjs/typeorm', () =>
  jest.requireActual<typeof import('../testing/nestjs-typeorm.stub')>(
    '../testing/nestjs-typeorm.stub',
  ),
);

describe('ProjectAccessService', () => {
  const exists = jest.fn();
  const service = new ProjectAccessService({
    exists,
  } as unknown as Repository<ProjectEntity>);

  beforeEach(() => exists.mockReset());

  it('resolves when the user owns the project, querying by id AND owner', async () => {
    exists.mockResolvedValue(true);

    await expect(service.assertOwned(7, 'user-a')).resolves.toBeUndefined();
    expect(exists).toHaveBeenCalledWith({
      where: { id: 7, ownerId: 'user-a' },
    });
  });

  it('throws 404 when the project is missing or belongs to someone else', async () => {
    exists.mockResolvedValue(false);

    await expect(service.assertOwned(7, 'user-b')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
