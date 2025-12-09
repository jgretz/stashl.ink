import {useForm} from '@tanstack/react-form';
import {Button} from '@web/components/ui/button';
import {FormInput} from '@web/components/forms/FormInput';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@web/components/ui/dialog';
import {type UpdateUserInput, type User} from '@web/services';

interface EditUserDialogProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSubmit: (id: string, input: UpdateUserInput) => void;
  isLoading: boolean;
  error: Error | null;
}

export function EditUserDialog({
  isOpen,
  user,
  onClose,
  onSubmit,
  isLoading,
  error,
}: EditUserDialogProps) {
  const form = useForm({
    defaultValues: {
      email: user?.email || '',
      name: user?.name || '',
      password: '',
    } as UpdateUserInput,
    onSubmit: async ({value}) => {
      if (user) {
        const updateData: UpdateUserInput = {};
        if (value.email !== user.email) updateData.email = value.email;
        if (value.name !== user.name) updateData.name = value.name;
        if (value.password) updateData.password = value.password;

        onSubmit(user.id, updateData);
      }
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='p-6'>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.Field name='name'>
            {(field) => (
              <FormInput
                id={field.name}
                name={field.name}
                label='Name'
                value={field.state.value as string}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
                error={field.state.meta.errors?.[0]}
                placeholder='Full name'
                autoFocus
                required
              />
            )}
          </form.Field>

          <form.Field name='email'>
            {(field) => (
              <FormInput
                id={field.name}
                name={field.name}
                label='Email'
                value={field.state.value as string}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
                error={field.state.meta.errors?.[0]}
                type='email'
                placeholder='user@example.com'
                required
              />
            )}
          </form.Field>

          <form.Field name='password'>
            {(field) => (
              <FormInput
                id={field.name}
                name={field.name}
                label='Password'
                value={field.state.value as string}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
                error={field.state.meta.errors?.[0]}
                type='password'
                placeholder='Leave blank to keep current password'
              />
            )}
          </form.Field>

          <div className='flex flex-row gap-3 mt-6'>
            <Button type='button' variant='outline' onClick={handleClose} className='flex-1'>
              Cancel
            </Button>

            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button type='submit' disabled={!canSubmit || isLoading} className='flex-1'>
                  {isLoading || isSubmitting ? 'Updating...' : 'Update User'}
                </Button>
              )}
            </form.Subscribe>
          </div>

          {error && (
            <p className='text-red-600 text-sm mt-2'>Failed to update user. Please try again.</p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
