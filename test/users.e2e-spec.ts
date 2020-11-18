import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getConnection, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Verification } from 'src/users/entities/verification.entity';

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
  let vertificationRepository: Repository<Verification>;
  let TOKEN: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    vertificationRepository = module.get<Repository<Verification>>(getRepositoryToken(Verification));
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
        const { body: { data: { login: { ok, error, token } } } } = res;
        expect(ok).toBe(true);
        expect(error).toBe(null);
        expect(token).toEqual(expect.any(String));
        TOKEN = token;
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
        const { body: { data: { login: { ok, error, token } } } } = res;
        expect(ok).toBe(false);
        expect(error).toEqual(expect.any(String));
        expect(token).toBe(null);
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
          const { body: { data: { userProfile: { ok, error, user: { id } } } } } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(id).toEqual(userId);
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
        const { body: { data: { userProfile: { ok, error, user } } } } = res;
        expect(ok).toBe(false);
        expect(error).toEqual(expect.any(String));
        expect(user).toBe(null);
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
    const CHANGE_EMAIL = 'changeTest@test.com';
    it('should change email', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', TOKEN)
        .send({
          query: `
            mutation {
              editProfile(input: {
                email: "${CHANGE_EMAIL}",
              }) {
                ok
                error
              }
            }`
        })
        .expect(200)
        .expect(res => {
          const { body: { data: { editProfile: { ok, error } } } } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });
    it('should have new email', () => {
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
          const { body: { data: { me: { email } } } } = res;
          expect(email).toBe(CHANGE_EMAIL);
        });
    })
  });

  describe('verifyEmail', () => {
    let verificationCode:string;
    beforeAll(async () => {
      const [verification] = await vertificationRepository.find();
      verificationCode = verification.code;
    });
    it('should verify email', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
            mutation {
              verifyEmail(input: {
                code: "${verificationCode}"
              }) {
                ok
                error
              }
            }`,
        })
        .expect(200)
        .expect(res => {
          const { body: { data: { verifyEmail: { ok, error } } } } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });
    it('should fail on wrong verification code not found', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
            mutation {
              verifyEmail(input: {
                code: "wrongCode!"
              }) {
                ok
                error
              }
            }`,
        })
        .expect(200)
        .expect(res => {
          const { body: { data: { verifyEmail: { ok, error } } } } = res;
          expect(ok).toBe(false);
          expect(error).toBe(`Verification not found.`);
        });
    });
  });
});
