import {Hono} from 'hono';
import {UserService} from '@stashl/domain/src/services/user.service';

export const userRoutes = new Hono();

// GET /api/users/profile
userRoutes.get('/profile', async (c) => {
  try {
    const {userId} = c.get('user');
    
    const userService = new UserService();
    const user = await userService.getUserById(userId);
    
    if (!user) {
      return c.json({error: 'User not found'}, 404);
    }

    const {password, ...userWithoutPassword} = user;
    return c.json({user: userWithoutPassword});
  } catch (error) {
    throw error;
  }
});

// PUT /api/users/profile
userRoutes.put('/profile', async (c) => {
  try {
    const {userId} = c.get('user');
    const body = await c.req.json();
    const {email, name, password} = body;

    const updateData: any = {};
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (password) updateData.password = password;

    const userService = new UserService();
    const updatedUser = await userService.updateUser(userId, updateData);
    
    if (!updatedUser) {
      return c.json({error: 'Failed to update user'}, 500);
    }

    const {password: _, ...userWithoutPassword} = updatedUser;
    return c.json({
      message: 'Profile updated successfully',
      user: userWithoutPassword,
    });
  } catch (error) {
    throw error;
  }
});

// DELETE /api/users/profile
userRoutes.delete('/profile', async (c) => {
  try {
    const {userId} = c.get('user');
    
    const userService = new UserService();
    const deleted = await userService.deleteUser(userId);
    
    if (!deleted) {
      return c.json({error: 'Failed to delete user'}, 500);
    }

    return c.json({message: 'User deleted successfully'});
  } catch (error) {
    throw error;
  }
});

// GET /api/users (admin only)
userRoutes.get('/', async (c) => {
  try {
    const userService = new UserService();
    const users = await userService.getAllUsers();

    const usersWithoutPasswords = users.map((user) => {
      const {password, gmailAccessToken, gmailRefreshToken, ...userWithoutSensitive} = user;
      return userWithoutSensitive;
    });

    return c.json({users: usersWithoutPasswords});
  } catch (error) {
    throw error;
  }
});

// PUT /api/users/:id (admin only - update specific user)
userRoutes.put('/:id', async (c) => {
  try {
    const targetUserId = c.req.param('id');
    const body = await c.req.json();
    const {email, name, password, emailIntegrationEnabled, emailFilter} = body;

    const updateData: Record<string, unknown> = {};
    if (email !== undefined) updateData.email = email;
    if (name !== undefined) updateData.name = name;
    if (password !== undefined) updateData.password = password;
    if (emailIntegrationEnabled !== undefined) updateData.emailIntegrationEnabled = emailIntegrationEnabled;
    if (emailFilter !== undefined) updateData.emailFilter = emailFilter;

    const userService = new UserService();
    const updatedUser = await userService.updateUser(targetUserId, updateData);

    if (!updatedUser) {
      return c.json({error: 'User not found'}, 404);
    }

    const {password: _, gmailAccessToken, gmailRefreshToken, ...userWithoutSensitive} = updatedUser;
    return c.json({
      message: 'User updated successfully',
      user: userWithoutSensitive,
    });
  } catch (error) {
    throw error;
  }
});