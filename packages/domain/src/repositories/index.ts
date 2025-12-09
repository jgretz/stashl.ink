import {setDependency} from '@stashl/iocdi';
import {DrizzleUserRepository} from './user.repository';
import {DrizzleLinkRepository} from './link.repository';
import {initializeDatabase} from '../db/connection';

export const REPOSITORY_SYMBOLS = {
  USER_REPOSITORY: Symbol('user-repository'),
  LINK_REPOSITORY: Symbol('link-repository'),
} as const;

export function initializeRepositories(databaseUrl?: string): void {
  initializeDatabase(databaseUrl);
  
  const userRepository = new DrizzleUserRepository();
  const linkRepository = new DrizzleLinkRepository();
  
  setDependency(REPOSITORY_SYMBOLS.USER_REPOSITORY, userRepository);
  setDependency(REPOSITORY_SYMBOLS.LINK_REPOSITORY, linkRepository);
}

export {DrizzleUserRepository} from './user.repository';
export {DrizzleLinkRepository} from './link.repository';