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

// GET /api/users (admin only - for future use)
userRoutes.get('/', async (c) => {
  try {
    const userService = new UserService();
    const users = await userService.getAllUsers();
    
    const usersWithoutPasswords = users.map(user => {
      const {password, ...userWithoutPassword} = user;
      return userWithoutPassword;
    });

    return c.json({users: usersWithoutPasswords});
  } catch (error) {
    throw error;
  }
});