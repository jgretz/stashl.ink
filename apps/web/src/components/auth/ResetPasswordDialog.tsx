import {useMutation} from '@tanstack/react-query';
import {useForm} from '@tanstack/react-form';
import {useState} from 'react';
import {requestPasswordReset} from '@web/services';
import {Button} from '@web/components/ui/button';
import {FormInput} from '@web/components/forms/FormInput';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@web/components/ui/dialog';

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetPasswordDialog({open, onOpenChange}: ResetPasswordDialogProps) {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  const resetMutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const form = useForm({
    defaultValues: {
      email: '',
    },
    onSubmit: async ({value}) => {
      if (!value.email) return;
      setEmail(value.email);
      resetMutation.mutate({data: {email: value.email}});
    },
  });

  const handleClose = () => {
    setSubmitted(false);
    setEmail('');
    form.reset();
    resetMutation.reset();
    onOpenChange(false);
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Check your email</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <p className='text-sm text-gray-600'>
              If an account exists for <strong>{email}</strong>, we've sent a password reset link to
              that email address.
            </p>
            <p className='text-sm text-gray-600'>
              Please check your email and follow the instructions to reset your password.
            </p>
            <Button onClick={handleClose} className='w-full'>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Reset your password</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className='space-y-4'
        >
          <p className='text-sm text-gray-600'>
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <form.Field name='email'>
            {(field) => (
              <FormInput
                id={field.name}
                name={field.name}
                label='Email address'
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
                type='email'
                placeholder='your@email.com'
                autoFocus
                required
              />
            )}
          </form.Field>

          {resetMutation.error && (
            <p className='text-red-600 text-sm'>Something went wrong. Please try again.</p>
          )}

          <div className='flex gap-3'>
            <Button type='button' variant='outline' onClick={handleClose} className='flex-1'>
              Cancel
            </Button>
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button
                  type='submit'
                  disabled={!canSubmit || resetMutation.isPending}
                  className='flex-1'
                >
                  {resetMutation.isPending || isSubmitting ? 'Sending...' : 'Send reset link'}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
