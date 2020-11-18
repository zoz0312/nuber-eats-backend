import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getConnection, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

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
  let usersRepository: Repository<User>;
  let TOKEN: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
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

  describe('userProfile', () => {
    let userId: number;
    beforeAll(async () => {
      const [user] = await usersRepository.find();
      userId = user.id;
    });
    it('should get userProfile', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', TOKEN)
        .send({
          query: `
            {
              userProfile(userId: ${userId}) {
                ok
                error
                user {
                  id
                }
              }
            }`,
        })
        .expect(200)
        .expect(res => {
          // { ok: true, error: null, user: { id: 1 } }
          const { body: { data: { userProfile } } } = res;
          expect(userProfile.ok).toBe(true);
          expect(userProfile.error).toBe(null);
          expect(userProfile.user.id).toEqual(userId);
        });
    });
    it('should not get userProfile', () => {
      return request(app.getHttpServer())
      .post(GRAPHQL_ENDPOINT)
      .set('X-JWT', TOKEN)
      .send({
        query: `
          {
            userProfile(userId: 33333333) {
              ok
              error
              user {
                id
              }
            }
          }`,
      })
      .expect(200)
      .expect(res => {
        // { error: 'User Not Found', ok: false, user: null }
        const { body: { data: { userProfile } } } = res;
        expect(userProfile.ok).toBe(false);
        expect(userProfile.error).toEqual(expect.any(String));
        expect(userProfile.user).toBe(null);
      });
    });
  });

  describe('me', () => {
    it('should find my profile', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', TOKEN)
        .send({
          query: `
            {
              me {
                email
              }
            }`,
        })
        .expect(200)
        .expect(res => {
          const { body: { data: { me } } } = res;
          expect(me.email).toBe(testUser.EMAIL);
        });
    });

    it('should not allow logged out user', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
            {
              me {
                email
              }
            }`,
        })
        .expect(200)
        .expect(res => {
          const { body: { data, errors } } = res;
          const [error] = errors;
          expect(data).toBe(null);
          expect(error.message).toBe('Forbidden resource');
        });
    });
  });

  describe('editProfile', () => {
    
  });

  it.todo('vertifyEmail');
});
