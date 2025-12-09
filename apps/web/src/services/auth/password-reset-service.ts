import {apiClient} from '../api-client';
import {createServerFn} from '@tanstack/react-start';

export interface PasswordResetRequestInput {
  email: string;
}

export interface PasswordResetValidateInput {
  token: string;
}

export interface PasswordResetConfirmInput {
  token: string;
  newPassword: string;
}

export const requestPasswordReset = createServerFn({
  method: 'POST',
})
  .inputValidator((data: PasswordResetRequestInput) => data)
  .handler(async function ({data}) {
    const response = await apiClient.post<{message: string; resetToken: string}>(
      '/auth/reset-password/request',
      data,
    );
    return response;
  });

export const validateResetToken = createServerFn({
  method: 'POST',
})
  .inputValidator((data: PasswordResetValidateInput) => data)
  .handler(async function ({data}) {
    const response = await apiClient.post<{message: string; userId: string}>(
      '/auth/reset-password/validate',
      data,
    );
    return response;
  });

export const confirmPasswordReset = createServerFn({
  method: 'POST',
})
  .inputValidator((data: PasswordResetConfirmInput) => data)
  .handler(async function ({data}) {
    const response = await apiClient.post<{message: string}>(
      '/auth/reset-password/confirm',
      data,
    );
    return response;
  });