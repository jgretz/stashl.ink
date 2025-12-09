import {Hono} from 'hono';
import {AuthService} from '@stashl/domain/src/services/auth.service';
import {UserService} from '@stashl/domain/src/services/user.service';

export const authRoutes = new Hono();

// POST /api/auth/register
authRoutes.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const {email, name, password} = body;

    if (!email || !name || !password) {
      return c.json({error: 'Email, name, and password are required'}, 400);
    }

    const authService = new AuthService();
    const result = await authService.register({email, name, password});

    return c.json({
      message: 'User registered successfully',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    throw error;
  }
});

// POST /api/auth/login
authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const {email, password} = body;

    if (!email || !password) {
      return c.json({error: 'Email and password are required'}, 400);
    }

    const authService = new AuthService();
    const result = await authService.login({email, password});

    return c.json({
      message: 'Login successful',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    throw error;
  }
});

// POST /api/auth/reset-password/request
authRoutes.post('/reset-password/request', async (c) => {
  try {
    const body = await c.req.json();
    const {email} = body;

    if (!email) {
      return c.json({error: 'Email is required'}, 400);
    }

    const userService = new UserService();
    const token = await userService.setPasswordResetToken(email);

    // In a real app, you'd send this token via email
    // For now, we'll return it in the response for testing
    return c.json({
      message: 'Password reset token generated',
      resetToken: token, // Remove this in production
    });
  } catch (error) {
    throw error;
  }
});

// POST /api/auth/reset-password/validate
authRoutes.post('/reset-password/validate', async (c) => {
  try {
    const body = await c.req.json();
    const {token} = body;

    if (!token) {
      return c.json({error: 'Reset token is required'}, 400);
    }

    const userService = new UserService();
    const user = await userService.validateResetToken(token);

    if (!user) {
      return c.json({error: 'Invalid or expired reset token'}, 400);
    }

    return c.json({
      message: 'Reset token is valid',
      userId: user.id,
    });
  } catch (error) {
    throw error;
  }
});

// POST /api/auth/reset-password/confirm
authRoutes.post('/reset-password/confirm', async (c) => {
  try {
    const body = await c.req.json();
    const {token, newPassword} = body;

    if (!token || !newPassword) {
      return c.json({error: 'Reset token and new password are required'}, 400);
    }

    const userService = new UserService();
    await userService.resetPassword(token, newPassword);

    return c.json({
      message: 'Password reset successful',
    });
  } catch (error) {
    throw error;
  }
});