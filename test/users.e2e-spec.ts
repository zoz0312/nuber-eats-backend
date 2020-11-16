import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getConnection } from 'typeorm';

jest.mock('got', () => {
  return {
    post: jest.fn(),
  }
});

const GRAPHQL_ENDPOINT = '/graphql';
const testUser = {
  EMAIL: 'e2e@e2etest.com',
  PASSWORD: 'e2e@password',
}

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let TOKEN: String;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await getConnection().dropDatabase();
    app.close();
  })

  describe('createAccount', () => {
    const ACCOUNT_QUERY = `
    mutation {
      createAccount(input: {
        email: "${testUser.EMAIL}",
        password: "${testUser.PASSWORD}",
        role:Client,
      }) {
        ok
        error
      }
    }`;

    it('should create account', () => {
      return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).send({
        query: ACCOUNT_QUERY,
      })
      .expect(200)
      .expect(res => {
        // { data: { createAccount: { ok: true, error: null } } }
        const { body: { data: { createAccount } } } = res;
        expect(createAccount.ok).toBe(true);
        expect(createAccount.error).toBe(null);
      });
    });
    it('should fail if account already exists', () => {
      return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).send({
        query: ACCOUNT_QUERY,
      })
      .expect(200)
      .expect(res => {
        // data: { createAccount: { ok: false, error: 'There is a user with that email already' } }
        const { body: { data: { createAccount } } } = res;
        expect(createAccount.ok).toBe(false);
        expect(createAccount.error).toEqual(expect.any(String));
      })
    });
  });

  describe('login', () => {
    it('should login with correct credentials', () => {
      return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).send({
        query: `
          mutation{
            login (input: {
              email: "${testUser.EMAIL}",
              password: "${testUser.PASSWORD}",
            }) {
              ok
              error
              token
            }
          }`,
      })
      .expect(200)
      .expect(res => {
        // login { ok: true, error: null, token: String }
        const { body: { data: { login } } } = res;
        expect(login.ok).toBe(true);
        expect(login.error).toBe(null);
        expect(login.token).toEqual(expect.any(String));
        TOKEN = login.token;
      });
    });
    it('should not be able to login with wrong credentials', () => {
      return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).send({
        query: `
          mutation{
            login (input: {
              email: "${testUser.EMAIL}",
              password: "xxxxxxx",
            }) {
              ok
              error
              token
            }
          }`,
      })
      .expect(200)
      .expect(res => {
        // login { ok: false, error: 'Worng password', token: null }
        const { body: { data: { login } } } = res;
        expect(login.ok).toBe(false);
        expect(login.error).toEqual(expect.any(String));
        expect(login.token).toBe(null);
      });
    });
  });

  it.todo('userProfile');
  it.todo('me');
  it.todo('vertifyEmail');
  it.todo('editProfile');
});
