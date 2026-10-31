import { NotFoundException, type INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { Server } from 'node:http';
import { AuthGuard } from '../auth/auth.guard';
import { GoogleTokenVerifierService } from '../auth/google-token-verifier.service';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

jest.mock('@nestjs/typeorm', () =>
  jest.requireActual<typeof import('../testing/nestjs-typeorm.stub')>(
    '../testing/nestjs-typeorm.stub',
  ),
);
jest.mock('./github.service', () => ({ GithubService: class {} }));

const USER = { id: 'user-a', email: 'a@example.com' };

describe('ProjectsController (HTTP, with the real AuthGuard)', () => {
  let app: INestApplication;
  let server: Server;
  const service = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    importFromGithub: jest.fn(),
    delete: jest.fn(),
  };
  const verify = jest.fn();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        { provide: ProjectsService, useValue: service },
        { provide: GoogleTokenVerifierService, useValue: { verify } },
        { provide: APP_GUARD, useClass: AuthGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    server = app.getHttpServer() as Server;
  });

  afterAll(() => app.close());

  beforeEach(() => {
    jest.resetAllMocks();
    verify.mockResolvedValue(USER);
  });

  const authed = (test: request.Test) =>
    test.set('Authorization', 'Bearer valid.token.here');

  describe('authentication', () => {
    it.each([
      ['GET', '/projects'],
      ['GET', '/projects/1'],
      ['POST', '/projects/import'],
      ['DELETE', '/projects/1'],
    ])('%s %s answers 401 without a token', async (method, path) => {
      const res =
        await request(server)[
          method.toLowerCase() as 'get' | 'post' | 'delete'
        ](path);

      expect(res.status).toBe(401);
      expect(service.findAll).not.toHaveBeenCalled();
      expect(service.delete).not.toHaveBeenCalled();
    });
  });

  describe('ownership scoping', () => {
    it('GET /projects asks the service for the caller’s projects only', async () => {
      service.findAll.mockResolvedValue([]);

      const res = await authed(request(server).get('/projects'));

      expect(res.status).toBe(200);
      expect(service.findAll).toHaveBeenCalledWith(USER.id);
    });

    it('GET /projects/:id passes the caller and surfaces 404 for foreign projects', async () => {
      service.findOne.mockRejectedValue(new NotFoundException());

      const res = await authed(request(server).get('/projects/5'));

      expect(res.status).toBe(404);
      expect(service.findOne).toHaveBeenCalledWith(5, USER.id);
    });

    it('POST /projects/import attaches the caller as owner', async () => {
      service.importFromGithub.mockResolvedValue({ id: 1 });
      const body = { repoUrl: 'https://github.com/a/b' };

      const res = await authed(
        request(server).post('/projects/import').send(body),
      );

      expect(res.status).toBe(201);
      expect(service.importFromGithub).toHaveBeenCalledWith(body, USER.id);
    });
  });

  describe('DELETE /projects/:id', () => {
    it('answers 204 and deletes on behalf of the caller', async () => {
      service.delete.mockResolvedValue(undefined);

      const res = await authed(request(server).delete('/projects/8'));

      expect(res.status).toBe(204);
      expect(service.delete).toHaveBeenCalledWith(8, USER.id);
    });

    it('answers 404 for a project the caller does not own', async () => {
      service.delete.mockRejectedValue(new NotFoundException());

      const res = await authed(request(server).delete('/projects/8'));

      expect(res.status).toBe(404);
    });

    it('answers 400 for a non-numeric id without calling the service', async () => {
      const res = await authed(request(server).delete('/projects/abc'));

      expect(res.status).toBe(400);
      expect(service.delete).not.toHaveBeenCalled();
    });
  });
});
