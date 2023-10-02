import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  afterAllSetup,
  baseTestStart,
  beforeAllSetup,
  publicTest,
} from './global-setup';
const testUser = {
  email: 'siwan@gmail.com',
  password: '12345',
};
describe('Podcasts Resolver', () => {
  let jwtToken: string;
  let app: INestApplication;
  let baseTest: request.Test;
  beforeAll(async () => {
    const { app: appInstance } = await beforeAllSetup();
    app = appInstance;
    baseTest = baseTestStart(app);
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
        baseTest,
      )
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount.ok).toBe(true);
          expect(res.body.data.createAccount.error).toBe(null);
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
        baseTest,
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
  });
  describe('getAllPodcasts', () => {});
  it.todo('getPodcast');
  it.todo('getEpisodes');
  it.todo('createPodcast');
  it.todo('deletePodcast');
  it.todo('updatePodcast');
  it.todo('createEpisode');
  it.todo('updateEpisode');
  it.todo('deleteEpisode');
});
