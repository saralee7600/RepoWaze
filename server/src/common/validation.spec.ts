import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { Type } from '@nestjs/common';
import { CreateEdgeDto } from '../edges/dto/create-edge.dto';
import { UpdateEdgeDto } from '../edges/dto/update-edge.dto';
import { CreateNodeDto } from '../nodes/dto/create-node.dto';
import { UpdateNodeDto } from '../nodes/dto/update-node.dto';
import { CreateProjectDto } from '../projects/dto/create-project.dto';
import { ImportProjectDto } from '../projects/dto/import-project.dto';
import { UpdateProjectDto } from '../projects/dto/update-project.dto';
import { VALIDATION_PIPE_OPTIONS } from './validation-options';

const pipe = new ValidationPipe(VALIDATION_PIPE_OPTIONS);

function validate<T>(metatype: Type<T>, body: unknown): Promise<unknown> {
  return pipe.transform(body, { type: 'body', metatype });
}

describe('request DTO validation', () => {
  describe('ImportProjectDto', () => {
    it('accepts a repo URL with an optional name', async () => {
      await expect(
        validate(ImportProjectDto, { repoUrl: 'owner/repo', name: 'My app' }),
      ).resolves.toMatchObject({ repoUrl: 'owner/repo', name: 'My app' });
      await expect(
        validate(ImportProjectDto, { repoUrl: 'owner/repo' }),
      ).resolves.toBeDefined();
    });

    it.each([
      ['a missing repoUrl', {}],
      ['an empty repoUrl', { repoUrl: '' }],
      ['a non-string repoUrl', { repoUrl: 42 }],
      ['an oversized repoUrl', { repoUrl: 'a'.repeat(501) }],
      ['a non-string name', { repoUrl: 'owner/repo', name: 7 }],
      ['an oversized name', { repoUrl: 'owner/repo', name: 'n'.repeat(256) }],
      ['an unknown property', { repoUrl: 'owner/repo', ownerId: 'someone' }],
    ])('rejects %s', async (_label, body) => {
      await expect(validate(ImportProjectDto, body)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('projects', () => {
    it('requires a valid URL and a name on create', async () => {
      await expect(
        validate(CreateProjectDto, {
          repoUrl: 'https://github.com/owner/repo',
          repoName: 'owner/repo',
        }),
      ).resolves.toBeDefined();
      await expect(
        validate(CreateProjectDto, { repoUrl: 'not a url', repoName: 'x' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('does not let clients set ownership fields', async () => {
      await expect(
        validate(UpdateProjectDto, { repoName: 'x', ownerId: 'someone-else' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        validate(CreateProjectDto, {
          repoUrl: 'https://github.com/owner/repo',
          repoName: 'x',
          id: 1,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('allows partial updates', async () => {
      await expect(validate(UpdateProjectDto, {})).resolves.toBeDefined();
      await expect(
        validate(UpdateProjectDto, { repoName: '' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('nodes', () => {
    const valid = { projectId: 1, label: 'User', type: 'entity' };

    it('accepts a valid node, with or without metadata', async () => {
      await expect(validate(CreateNodeDto, valid)).resolves.toBeDefined();
      await expect(
        validate(CreateNodeDto, { ...valid, metadata: { tableName: 'user' } }),
      ).resolves.toBeDefined();
      await expect(
        validate(CreateNodeDto, { ...valid, metadata: null }),
      ).resolves.toBeDefined();
    });

    it.each([
      ['a string projectId', { ...valid, projectId: '1' }],
      ['a fractional projectId', { ...valid, projectId: 1.5 }],
      ['a negative projectId', { ...valid, projectId: -3 }],
      ['an empty label', { ...valid, label: '' }],
      ['array metadata', { ...valid, metadata: [] }],
      ['an unknown property', { ...valid, isAdmin: true }],
    ])('rejects %s', async (_label, body) => {
      await expect(validate(CreateNodeDto, body)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('validates only the fields sent on update', async () => {
      await expect(
        validate(UpdateNodeDto, { label: 'Renamed' }),
      ).resolves.toBeDefined();
      await expect(
        validate(UpdateNodeDto, { label: 123 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('edges', () => {
    const valid = {
      projectId: 1,
      sourceNodeId: 2,
      targetNodeId: 3,
      relationType: 'one-to-many',
    };

    it('accepts every supported relation kind', async () => {
      for (const relationType of [
        'one-to-one',
        'one-to-many',
        'many-to-one',
        'many-to-many',
      ]) {
        await expect(
          validate(CreateEdgeDto, { ...valid, relationType }),
        ).resolves.toBeDefined();
      }
    });

    it.each([
      ['an unsupported relationType', { ...valid, relationType: 'friends' }],
      ['a missing sourceNodeId', { ...valid, sourceNodeId: undefined }],
      ['a non-numeric targetNodeId', { ...valid, targetNodeId: 'abc' }],
      ['an unknown property', { ...valid, extra: 1 }],
    ])('rejects %s', async (_label, body) => {
      await expect(validate(CreateEdgeDto, body)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('validates only the fields sent on update', async () => {
      await expect(
        validate(UpdateEdgeDto, { label: 'owns' }),
      ).resolves.toBeDefined();
      await expect(
        validate(UpdateEdgeDto, { relationType: 'nope' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
