import type {Link, CreateLinkInput} from '@stashl/domain';
import {config} from '../config';
import {getAuthHeaders} from './auth';

export interface LinksResponse {
  links: Link[];
}

async function graphqlRequest(query: string, variables?: any) {
  const headers = await getAuthHeaders();
  
  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0]?.message || 'GraphQL error');
  }

  return result.data;
}

export async function getLinks(): Promise<LinksResponse> {
  const query = `
    query GetLinks {
      links {
        _id
        url
        title
        description
        dateAdded
      }
    }
  `;

  return await graphqlRequest(query);
}

export async function createLink(input: CreateLinkInput): Promise<{createLink: Link}> {
  const mutation = `
    mutation CreateLink($input: CreateLinkInput!) {
      createLink(input: $input) {
        _id
        url
        title
        description
        dateAdded
      }
    }
  `;

  return await graphqlRequest(mutation, {input});
}

export async function deleteLink(id: string): Promise<{deleteLink: boolean}> {
  const mutation = `
    mutation DeleteLink($id: ID!) {
      deleteLink(id: $id)
    }
  `;

  return await graphqlRequest(mutation, {id});
}
