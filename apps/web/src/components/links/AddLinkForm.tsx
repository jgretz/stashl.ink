import {useState} from 'react';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useForm} from '@tanstack/react-form';
import {createLink} from '@web/services';
import type {CreateLinkInput} from '@stashl/domain-types';
import {fetchPageMetadata, normalizeUrl, isValidUrl} from '@stashl/metadata';
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
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const queryClient = useQueryClient();

  const createLinkMutation = useMutation({
    mutationFn: (input: CreateLinkInput) => createLink(input),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['links']});
      setIsOpen(false);
      form.reset();
    },
  });

  const form = useForm({
    defaultValues: {
      url: '',
    },
    onSubmit: async ({value}) => {
      if (!value.url?.trim()) {
        return;
      }

      const normalizedUrl = normalizeUrl(value.url.trim());

      if (!isValidUrl(normalizedUrl)) {
        return;
      }

      setIsLoadingMetadata(true);

      try {
        const metadata = await fetchPageMetadata(normalizedUrl);

        const linkData: CreateLinkInput = {
          url: normalizedUrl,
          title: metadata.title,
          description: metadata.description,
        };

        createLinkMutation.mutate(linkData);
      } catch (error) {
        console.error('Error fetching metadata:', error);
        // Fallback: create link with just URL
        createLinkMutation.mutate({
          url: normalizedUrl,
          title: new URL(normalizedUrl).hostname,
        });
      } finally {
        setIsLoadingMetadata(false);
      }
    },
  });

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
              form.handleSubmit();
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
              <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                {([canSubmit, isSubmitting]) => (
                  <Button
                    type='submit'
                    disabled={!canSubmit || createLinkMutation.isPending || isLoadingMetadata}
                    className='flex-1'
                  >
                    {isLoadingMetadata
                      ? 'Fetching info...'
                      : createLinkMutation.isPending || isSubmitting
                        ? 'Adding...'
                        : 'Add Link'}
                  </Button>
                )}
              </form.Subscribe>
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
