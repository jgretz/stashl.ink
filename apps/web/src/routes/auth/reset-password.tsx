import {createFileRoute, useNavigate, useSearch} from '@tanstack/react-router';
import {useMutation, useQuery} from '@tanstack/react-query';
import {useForm} from '@tanstack/react-form';
import {useEffect} from 'react';
import {validateResetToken, resetPassword} from '../../services';
import {Button} from '../../components/ui/button';
import {FormInput} from '../../components/forms/FormInput';

export const Route = createFileRoute('/auth/reset-password')({
  component: ResetPassword,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || '',
    email: (search.email as string) || '',
  }),
});

function ResetPassword() {
  const navigate = useNavigate();
  const {token, email} = useSearch({from: '/auth/reset-password'});

  const validationQuery = useQuery({
    queryKey: ['validateResetToken', token, email],
    queryFn: () => validateResetToken({data: {token}}),
    enabled: !!(token && email),
    retry: false,
  });

  const resetMutation = useMutation({
    mutationFn: ({newPassword}: {newPassword: string}) => resetPassword(token, newPassword),
    onSuccess: (data) => {
      if (data.message) {
        navigate({
          to: '/login',
          search: {message: 'Password reset successfully. Please log in.'},
        });
      }
    },
  });

  const form = useForm({
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
    onSubmit: async ({value}) => {
      if (value.newPassword !== value.confirmPassword) {
        return;
      }
      if (value.newPassword.length < 6) {
        return;
      }
      resetMutation.mutate({newPassword: value.newPassword});
    },
  });

  useEffect(() => {
    if (!token || !email) {
      navigate({to: '/login'});
    }
  }, [token, email, navigate]);

  if (validationQuery.isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <p>Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (validationQuery.error || !validationQuery.data?.userId) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='max-w-md mx-auto p-8 text-center'>
          <div className='bg-white p-8 rounded-lg border border-gray-200 shadow-sm'>
            <h1 className='text-2xl font-bold text-red-600 mb-4'>Invalid Reset Link</h1>
            <p className='text-gray-600 mb-6'>
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Button onClick={() => navigate({to: '/login'})} className='w-full'>
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='max-w-md mx-auto w-full px-4'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold'>Reset Password</h1>
          <p className='text-gray-600 mt-2'>Enter your new password</p>
        </div>

        <div className='bg-white p-8 rounded-lg border border-gray-200 shadow-sm'>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <form.Field name='newPassword'>
              {(field) => (
                <FormInput
                  id={field.name}
                  name={field.name}
                  label='New Password'
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                  error={
                    field.state.value && field.state.value.length < 6
                      ? 'Password must be at least 6 characters'
                      : undefined
                  }
                  type='password'
                  placeholder='Enter new password'
                  autoFocus
                  required
                />
              )}
            </form.Field>

            <form.Field name='confirmPassword'>
              {(field) => (
                <FormInput
                  id={field.name}
                  name={field.name}
                  label='Confirm New Password'
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                  error={
                    field.state.value &&
                    form.state.values.newPassword &&
                    field.state.value !== form.state.values.newPassword
                      ? 'Passwords do not match'
                      : undefined
                  }
                  type='password'
                  placeholder='Confirm new password'
                  required
                />
              )}
            </form.Field>

            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => {
                const passwordsMatch =
                  form.state.values.newPassword === form.state.values.confirmPassword;

                const passwordValid = form.state.values.newPassword.length >= 6;
                const isValid = canSubmit && passwordsMatch && passwordValid;

                return (
                  <Button
                    type='submit'
                    // disabled={!isValid || resetMutation.isPending}
                    className='w-full mt-6'
                  >
                    {resetMutation.isPending || isSubmitting ? 'Resetting...' : 'Reset Password'}
                  </Button>
                );
              }}
            </form.Subscribe>

            {resetMutation.error && (
              <p className='text-red-600 text-sm mt-2 text-center'>
                {resetMutation.error?.message || 'Failed to reset password. Please try again.'}
              </p>
            )}

            {resetMutation.data && !resetMutation.data.message && (
              <p className='text-red-600 text-sm mt-2 text-center'>{resetMutation.data.message}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
