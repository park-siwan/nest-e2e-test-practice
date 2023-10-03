import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from 'src/app.module';
import { Podcast } from 'src/podcast/entities/podcast.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import * as request from 'supertest';

export const beforeAllSetup = async (): Promise<{
  app: INestApplication<any>;
  usersRepository: Repository<User>;
  podcastRepository: Repository<Podcast>;
}> => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let podcastRepository: Repository<Podcast>;
  try {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    podcastRepository = module.get<Repository<Podcast>>(
      getRepositoryToken(Podcast),
    );
    await app.init();
    return { app, usersRepository, podcastRepository };
  } catch (err) {
    throw new Error();
  }
};

export const afterAllSetup = async () => {
  const dbPath = path.resolve(__dirname, '../test-db.sqlite3');
  try {
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath); //데이터베이스 파일 삭제
    }
  } catch (error) {
    console.log(error);
  }
};

export const GRAPHQL_ENDPOINT = '/graphql';
