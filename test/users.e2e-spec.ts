import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import * as request from 'supertest';
import {
  GRAPHQL_ENDPOINT,
  afterAllSetup,
  beforeAllSetup,
} from './global-setup';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';

const testUser = {
  email: 'siwan@gmail.com',
  password: '12345',
};

describe('UserModule (e2e)', () => {
  let jwtToken: string;
  let app: INestApplication;
  let usersRepository: Repository<User>;

  const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  const publicTest = (query: string) => baseTest().send({ query });
  const privateTest = (query: string) =>
    baseTest().set('X-JWT', jwtToken).send({ query });
  beforeAll(async () => {
    const { app: appInstance, usersRepository: usersRepositoryInstance } =
      await beforeAllSetup();
    app = appInstance;
    usersRepository = usersRepositoryInstance;
  });

  afterAll(async () => {
    afterAllSetup();
  });

  describe('createAccount', () => {
    it('should create account', () => {
      return publicTest(
        `
        mutation {
          createAccount(input:{
            email:"${testUser.email}",
            password:"${testUser.password}",
            role:Host
          }){
            ok
            error
          }
        }
        `,
      )
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount.ok).toBe(true);
          expect(res.body.data.createAccount.error).toBe(null);
        });
    });
    it('should fail if account already exists', () => {
      return publicTest(
        `
      mutation {
        createAccount(input:{
          email:"${testUser.email}",
          password:"${testUser.password}",
          role:Host
        }){
          ok
          error
        }
      }
      `,
      )
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount.ok).toBe(false);
          expect(res.body.data.createAccount.error).toBe(
            'There is a user with that email already',
          );
        });
    });
  });
  describe('login', () => {
    it('should login with correct credentials', () => {
      return publicTest(
        `
      mutation {
        login(input: {
          email:"${testUser.email}",
          password:"${testUser.password}",
        }) {
          ok
          error
          token
        }
      }
      `,
      )
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBe(true);
          expect(login.error).toBe(null);
          expect(login.token).toEqual(expect.any(String));
          jwtToken = login.token;
        });
    });
    it('should not be able login with wrong credentials', () => {
      return publicTest(
        `
      mutation {
        login(input: {
          email:"${testUser.email}",
          password: "xxx",
        }) {
          ok
          error
          token
        }
      }
      `,
      )
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBe(false);
          expect(login.error).toBe('Wrong password');
          expect(login.token).toEqual(null);
        });
    });
  });
  // describe('me', () => {});
  describe('seeProfile', () => {
    let userId: number;
    beforeAll(async () => {
      const [user] = await usersRepository.find();
      userId = user.id;
    });
    it("should see a user's profile", () => {
      return privateTest(
        `
        {
          seeProfile(userId:${userId}){
            ok
            error
            user {
              id
            }
          }
        }
        `,
      )
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                seeProfile: {
                  ok,
                  error,
                  user: { id },
                },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(id).toBe(userId);
        });
    });
    it('should not find a profile', () => {
      return privateTest(
        `
        {
          seeProfile(userId:666){
            ok
            error
            user {
              id
            }
          }
        }
        `,
      )
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                seeProfile: { ok, error, user },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(error).toBe('User Not Found');
          expect(user).toBe(null);
        });
    });
  });
  describe('me', () => {
    it('should find my profile', () => {
      return privateTest(
        `
        {
          me {
            email
          }
        }
        `,
      )
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                me: { email },
              },
            },
          } = res;
          expect(email).toBe(testUser.email);
        });
    });
    it('should not allow logged out user', () => {
      return publicTest(
        `
        {
          me {
            email
          }
        }
        `,
      )
        .expect(200)
        .expect((res) => {
          const {
            body: { errors },
          } = res;
          const [error] = errors;
          expect(error.message).toBe('Forbidden resource');
        });
    });
  });
  describe('editProfile', () => {
    const NEW_EMAIL = 'nico@new.com';
    it('should change email', () => {
      return privateTest(
        `
            mutation {
              editProfile(input:{
                email: "${NEW_EMAIL}"
              }) {
                ok
                error
              }
            }
        `,
      )
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                editProfile: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });
    it('should have new email', () => {
      return privateTest(
        `
          {
            me {
              email
            }
          }
        `,
      )
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                me: { email },
              },
            },
          } = res;
          expect(email).toBe(NEW_EMAIL);
        });
    });
  });
});
