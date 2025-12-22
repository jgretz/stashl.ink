import {useState} from 'react';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useForm} from '@tanstack/react-form';
import {createLink} from '@web/services';
import {normalizeUrl, isValidUrl} from '@stashl/metadata';
import {Button} from '@web/components/ui/button';
import {FormInput} from '@web/components/forms/FormInput';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@web/components/ui/dialog';
import {DialogDescription} from '@radix-ui/react-dialog';
import {Plus} from 'lucide-react';

export function AddLinkForm() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      url: '',
    },
    onSubmit: () => {},
  });

  const createLinkMutation = useMutation({
    mutationFn: createLink,
    onSuccess: () => {
      setIsOpen(false);
      form.reset();
      queryClient.invalidateQueries({queryKey: ['links']});
    },
  });

  const handleSubmit = () => {
    const url = form.getFieldValue('url');
    if (!url?.trim()) return;

    const normalizedUrl = normalizeUrl(url.trim());
    if (!isValidUrl(normalizedUrl)) return;

    createLinkMutation.mutate({url: normalizedUrl});
  };

  return (
    <div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button size="icon" className='rounded-full w-12 h-12' onClick={() => setIsOpen(true)}>
            <Plus className="h-5 w-5" />
          </Button>
        </DialogTrigger>

        <DialogContent className='p-6'>
          <DialogHeader>
            <DialogTitle>Add New Link</DialogTitle>
            <DialogDescription>Add a new link to your collection</DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSubmit();
            }}
          >
            <form.Field name='url'>
              {(field) => (
                <FormInput
                  id={field.name}
                  name={field.name}
                  label='URL'
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                  error={field.state.meta.errors?.[0]}
                  type='url'
                  placeholder='https://example.com'
                  autoFocus
                  required
                />
              )}
            </form.Field>

            <div className='flex flex-row'>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setIsOpen(false);
                  form.reset();
                }}
                className='flex-1'
              >
                Cancel
              </Button>
              <div className='w-3'></div>
              <Button
                type='submit'
                disabled={createLinkMutation.isPending}
                className='flex-1'
              >
                {createLinkMutation.isPending ? 'Adding...' : 'Add Link'}
              </Button>
            </div>

            {createLinkMutation.error && (
              <p className='text-red-600 text-sm mt-2'>Failed to add link. Please try again.</p>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
