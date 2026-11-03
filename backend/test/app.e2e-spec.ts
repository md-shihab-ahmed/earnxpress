import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformResponseInterceptor } from '../src/common/interceptors/transform-response.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';

describe('EarnXpress API (E2E Integration Test)', () => {
  let app: INestApplication;
  let mockPrisma: any;

  beforeAll(async () => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      userProfile: {
        create: jest.fn(),
      },
      demoLedgerAccount: {
        findMany: jest.fn().mockResolvedValue([]),
        createMany: jest.fn(),
      },
      task: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $transaction: jest.fn((cb) => cb(mockPrisma)),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalHttpExceptionFilter());
    app.useGlobalInterceptors(new TransformResponseInterceptor());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Public Market Endpoints', () => {
    it('/api/v1/demo-finance/fx-snapshots (GET) should return 200 with indicative currency rates', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/demo-finance/fx-snapshots')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.baseCurrency).toBe('USD');
      expect(response.body.data.rates.BDT).toBe(121.5);
      expect(response.body.data.isDemo).toBe(true);
    });

    it('/api/v1/tasks (GET) should return 200 with open marketplace task catalog', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/tasks')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('2. Authentication & Validation Defenses', () => {
    it('/api/v1/auth/register (POST) should reject malformed payload with 400 Validation Error', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'not-an-email',
          // missing password and required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ERR_VALIDATION_FAILED');
    });

    it('/api/v1/tasks (POST) should reject unauthenticated request with 401 Unauthorized', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .send({ title: 'Unauthorized Task' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('/api/v1/admin/users/fake-id/role (POST) should reject unauthenticated request with 401 Unauthorized', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/users/fake-id/role')
        .send({ newRole: 'MODERATOR', reason: 'Attempt' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
