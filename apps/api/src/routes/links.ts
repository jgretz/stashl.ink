import {Hono} from 'hono';
import {LinkService} from '@stashl/domain/src/services/link.service';
import {fetchPageMetadata} from '@stashl/metadata';

export const linkRoutes = new Hono();

// GET /api/links
linkRoutes.get('/', async (c) => {
  try {
    const {userId} = c.get('user');
    
    const linkService = new LinkService();
    const links = await linkService.getLinksByUserId(userId);
    
    return c.json({links});
  } catch (error) {
    throw error;
  }
});

// GET /api/links/:id
linkRoutes.get('/:id', async (c) => {
  try {
    const {userId} = c.get('user');
    const linkId = c.req.param('id');
    
    const linkService = new LinkService();
    const link = await linkService.getLinkById(linkId);
    
    if (!link) {
      return c.json({error: 'Link not found'}, 404);
    }

    // Ensure user can only access their own links
    if (link.userId !== userId) {
      return c.json({error: 'Unauthorized access to this link'}, 403);
    }

    return c.json({link});
  } catch (error) {
    throw error;
  }
});

// POST /api/links
linkRoutes.post('/', async (c) => {
  try {
    const {userId} = c.get('user');
    const body = await c.req.json();
    const {url} = body;

    if (!url) {
      return c.json({error: 'URL is required'}, 400);
    }

    // Fetch metadata server-side
    const metadata = await fetchPageMetadata(url);

    const linkService = new LinkService();
    const link = await linkService.createLink({
      url,
      title: metadata.title,
      description: metadata.description,
    }, userId);

    return c.json({
      message: 'Link created successfully',
      link,
    }, 201);
  } catch (error) {
    throw error;
  }
});

// PUT /api/links/:id
linkRoutes.put('/:id', async (c) => {
  try {
    const {userId} = c.get('user');
    const linkId = c.req.param('id');
    const body = await c.req.json();
    const {url, title, description} = body;

    const updateData: any = {};
    if (url) updateData.url = url;
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    const linkService = new LinkService();
    const updatedLink = await linkService.updateLink(linkId, updateData, userId);
    
    if (!updatedLink) {
      return c.json({error: 'Failed to update link'}, 500);
    }

    return c.json({
      message: 'Link updated successfully',
      link: updatedLink,
    });
  } catch (error) {
    throw error;
  }
});

// DELETE /api/links/:id
linkRoutes.delete('/:id', async (c) => {
  try {
    const {userId} = c.get('user');
    const linkId = c.req.param('id');
    
    const linkService = new LinkService();
    const deleted = await linkService.deleteLink(linkId, userId);
    
    if (!deleted) {
      return c.json({error: 'Failed to delete link'}, 500);
    }

    return c.json({message: 'Link deleted successfully'});
  } catch (error) {
    throw error;
  }
});