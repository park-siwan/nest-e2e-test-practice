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

  beforeAll(async () => {
    const { app: appInstance } = await beforeAllSetup();
    app = appInstance;
  });
  const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  const publicTest = (query: string) => baseTest().send({ query });
  const privateTest = (query: string) =>
    baseTest().set('X-JWT', jwtToken).send({ query });

  afterAll(async () => {
    await afterAllSetup();
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
    it('should successfully update podcast', () => {
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
      )
        .expect(200)
        .expect((res) => {
          const {
            updatePodcast: { ok, error },
          } = resDecomposer(res);
          expect(ok).toEqual(true);
          expect(error).toEqual(null);
        });
    });
  });

  describe('createEpisode', () => {
    it('should create a new episode', () => {
      return privateTest(`
      mutation{
        createEpisode(input:{
          title:"episodeTitle",
          category:"episodeCategory",
          podcastId:1
        }){
          ok
          error
        }
      }
      `)
        .expect(200)
        .expect((res) => {
          const {
            createEpisode: { ok, error },
          } = resDecomposer(res);
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });
  });
  describe('getEpisodes', () => {
    it('should get episodes', () => {
      return privateTest(`
    {
      getEpisodes(input:{id:1}){
        ok
        error
      }
    }
    `)
        .expect(200)
        .expect((res) => {
          const {
            getEpisodes: { ok, error },
          } = resDecomposer(res);
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });
  });
  describe('updateEpisode', () => {
    it('should update podcast', () => {
      return privateTest(`
        mutation {
          updateEpisode(
            input: {
              title: "episodeUpdate"
              category: "episodeCategoryUpdate"
              podcastId: 1
              episodeId: 1
            }
          ) {
            ok
            error
          }
        }    
        `)
        .expect(200)
        .expect((res) => {
          const {
            updateEpisode: { ok, error },
          } = resDecomposer(res);
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });
    it('should return error if the associated podcast does not exist', () => {
      return privateTest(`
        mutation {
          updateEpisode(
            input: {
              title: "episodeUpdate"
              category: "episodeCategoryUpdate"
              podcastId: 999
              episodeId: 1
            }
          ) {
            ok
            error
          }
        }    
        `)
        .expect(200)
        .expect((res) => {
          const {
            updateEpisode: { ok, error },
          } = resDecomposer(res);
          expect(ok).toBe(false);
          expect(error).toBe('Podcast with id 999 not found');
        });
    });
    it('should return error if the associated episode does not exist', () => {
      return privateTest(`
        mutation {
          updateEpisode(
            input: {
              title: "episodeUpdate"
              category: "episodeCategoryUpdate"
              podcastId: 1
              episodeId: 999
            }
          ) {
            ok
            error
          }
        }    
        `)
        .expect(200)
        .expect((res) => {
          const {
            updateEpisode: { ok, error },
          } = resDecomposer(res);
          expect(ok).toBe(false);
          expect(error).toBe(
            'Episode with id 999 not found in podcast with id 1',
          );
        });
    });
  });

  describe('deleteEpisode', () => {
    it('should delete episode', () => {
      return privateTest(`
      mutation {
        deleteEpisode(input: { podcastId: 1, episodeId: 1 }) {
          ok
          error
        }
      }
      
        `)
        .expect(200)
        .expect((res) => {
          const {
            deleteEpisode: { ok, error },
          } = resDecomposer(res);
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });
    it('should return error if the associated podcast does not exist', () => {
      return privateTest(`
      mutation {
        deleteEpisode(input: { podcastId: 999, episodeId: 1 }) {
          ok
          error
        }
      }
      
        `)
        .expect(200)
        .expect((res) => {
          const {
            deleteEpisode: { ok, error },
          } = resDecomposer(res);
          expect(ok).toBe(false);
          expect(error).toBe('Podcast with id 999 not found');
        });
    });
    it('should return error if the associated episode does not exist', () => {
      return privateTest(`
      mutation {
        deleteEpisode(input: { podcastId: 1, episodeId: 999 }) {
          ok
          error
        }
      }
      
        `)
        .expect(200)
        .expect((res) => {
          const {
            deleteEpisode: { ok, error },
          } = resDecomposer(res);
          expect(ok).toBe(false);
          expect(error).toBe(
            'Episode with id 999 not found in podcast with id 1',
          );
        });
    });
  });
  describe('deletePodcast', () => {
    it('should delete podcast', () => {
      return privateTest(
        `
        mutation{
          deletePodcast(input:{id:1}){
            ok
            error
          }
        }
      `,
      )
        .expect(200)
        .expect((res) => {
          const {
            deletePodcast: { ok, error },
          } = resDecomposer(res);
          expect(ok).toEqual(true);
          expect(error).toEqual(null);
        });
    });
    it('should return an error if the podcast does not exist', () => {
      return privateTest(
        `
        mutation{
          deletePodcast(input:{id:999}){
            ok
            error
          }
        }
      `,
      )
        .expect(200)
        .expect((res) => {
          const {
            deletePodcast: { ok, error },
          } = resDecomposer(res);
          expect(ok).toEqual(false);
          expect(error).toEqual('Podcast with id 999 not found');
        });
    });
  });
});
