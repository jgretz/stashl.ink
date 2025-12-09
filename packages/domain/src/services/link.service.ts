import {resolveDependency} from '@stashl/iocdi';
import {REPOSITORY_SYMBOLS} from '../repositories';
import type {LinkRepository, Link, CreateLinkInput, UpdateLinkInput} from '../types';

export class LinkService {
  private repository: LinkRepository;

  constructor() {
    const repo = resolveDependency<LinkRepository>(REPOSITORY_SYMBOLS.LINK_REPOSITORY);
    if (!repo) {
      throw new Error('LinkRepository not initialized. Call initializeRepositories() first.');
    }
    this.repository = repo;
  }

  async createLink(input: CreateLinkInput, userId: string): Promise<Link> {
    if (!input.url.trim()) {
      throw new Error('URL cannot be empty');
    }

    if (!input.title.trim()) {
      throw new Error('Title cannot be empty');
    }

    const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlRegex.test(input.url)) {
      throw new Error('Invalid URL format');
    }

    let url = input.url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    return await this.repository.create({
      ...input,
      url,
    }, userId);
  }

  async getLinkById(id: string): Promise<Link | null> {
    return await this.repository.findById(id);
  }

  async getLinksByUserId(userId: string): Promise<Link[]> {
    return await this.repository.findAllByUser(userId);
  }

  async getAllLinks(): Promise<Link[]> {
    return await this.repository.findAll();
  }

  async updateLink(id: string, input: UpdateLinkInput, userId: string): Promise<Link | null> {
    const link = await this.repository.findById(id);
    if (!link) {
      throw new Error('Link not found');
    }

    if (link.userId !== userId) {
      throw new Error('Unauthorized to update this link');
    }

    if (input.url) {
      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlRegex.test(input.url)) {
        throw new Error('Invalid URL format');
      }

      if (!input.url.startsWith('http://') && !input.url.startsWith('https://')) {
        input.url = 'https://' + input.url;
      }
    }

    return await this.repository.update(id, input);
  }

  async deleteLink(id: string, userId: string): Promise<boolean> {
    const link = await this.repository.findById(id);
    if (!link) {
      throw new Error('Link not found');
    }

    if (link.userId !== userId) {
      throw new Error('Unauthorized to delete this link');
    }

    return await this.repository.delete(id);
  }
}