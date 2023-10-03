import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  GRAPHQL_ENDPOINT,
  afterAllSetup,
  beforeAllSetup,
} from './global-setup';

const resDecomposer = (res: request.Response) => {
  return res.body.data;
};

const testUser = {
  email: 'siwan@gmail.com',
  password: '12345',
};
const title = 'abc';
const category = 'def';

describe('Podcasts Resolver', () => {
  let jwtToken: string;
  let app: INestApplication;
  const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  const publicTest = (query: string) => baseTest().send({ query });
  const privateTest = (query: string) =>
    baseTest().set('X-JWT', jwtToken).send({ query });

  beforeAll(async () => {
    const { app: appInstance } = await beforeAllSetup();
    app = appInstance;
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
  });

  describe('createPodcast', () => {
    it('should create a new podcast', () => {
      return privateTest(
        `
      mutation {
        createPodcast(input:{
          title:"${title}",
          category:"${category}"
        }) {
          ok
          id
          error
        }
      }
  `,
      )
        .expect(200)
        .expect((res) => {
          const {
            createPodcast: { ok, error, id },
          } = resDecomposer(res);
          expect(ok).toBe(true);
          expect(id).toEqual(expect.any(Number));
          expect(error).toBe(null);
        });
    });
  });
  describe('getAllPodcasts', () => {
    it('should return a list of podcasts', () => {
      return privateTest(
        `
        {
          getAllPodcasts {
            ok
            error
            podcasts {
            title
            }
          }
        }
      `,
      )
        .expect(200)
        .expect((res) => {
          const {
            getAllPodcasts: { ok, error, podcasts },
          } = resDecomposer(res);
          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(podcasts).toBeInstanceOf(Array);
        });
    });
  });
  describe('getPodcast', () => {
    it('should return a podcast', () => {
      return privateTest(
        `
        {
          getPodcast(input:{id:1}){
            error
            ok
            podcast{
              title
              category
              rating
              episodes{
                title
              }
            }
          }
        }        
      `,
      )
        .expect(200)
        .expect((res) => {
          const {
            getPodcast: { ok, error, podcast },
          } = resDecomposer(res);
          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(podcast.title).toEqual(expect.any(String));
          expect(podcast.category).toEqual(expect.any(String));
          expect(podcast.rating).toEqual(expect.any(Number));
          expect(podcast.episodes).toBeInstanceOf(Array);
        });
    });
  });
  describe('updatePodcast', () => {
    it('should return an error message if no podcasts are found', () => {
      return privateTest(
        `
      mutation {
        updatePodcast(
          input: {
            id: 1
            payload: { title: "updateTitle2", category: "updateCategory2", rating: 2 }
          }
        ){
          ok
          error
        }
      }
      `,
      ).expect(200);
    });
  });
  // describe('deletePodcast', () => {});

  // describe('createEpisode', () => {});
  // describe('getEpisodes', () => {});
  // describe('updateEpisode', () => {});
  // describe('deleteEpisode', () => {});
});
