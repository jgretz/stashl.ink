import {useState} from 'react';
import {useForm} from '@tanstack/react-form';
import {useCreateFeed} from '@web/services/feeds';
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

export function AddFeedDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const createFeedMutation = useCreateFeed();

  const form = useForm({
    defaultValues: {
      title: '',
      feedUrl: '',
      siteUrl: '',
    },
    onSubmit: async ({value}) => {
      if (!value.title?.trim() || !value.feedUrl?.trim()) {
        return;
      }

      createFeedMutation.mutate(
        {
          title: value.title.trim(),
          feedUrl: value.feedUrl.trim(),
          siteUrl: value.siteUrl?.trim() || undefined,
        },
        {
          onSuccess: () => {
            setIsOpen(false);
            form.reset();
          },
        },
      );
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size='icon' className='rounded-full w-12 h-12'>
          <Plus className='h-5 w-5' />
        </Button>
      </DialogTrigger>

      <DialogContent className='p-6'>
        <DialogHeader>
          <DialogTitle>Add RSS Feed</DialogTitle>
          <DialogDescription>Subscribe to a new RSS feed</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.Field name='title'>
            {(field) => (
              <FormInput
                id={field.name}
                name={field.name}
                label='Title'
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
                error={field.state.meta.errors?.[0]}
                placeholder='My Favorite Blog'
                autoFocus
                required
              />
            )}
          </form.Field>

          <form.Field name='feedUrl'>
            {(field) => (
              <FormInput
                id={field.name}
                name={field.name}
                label='Feed URL'
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
                error={field.state.meta.errors?.[0]}
                type='url'
                placeholder='https://example.com/feed.xml'
                required
              />
            )}
          </form.Field>

          <form.Field name='siteUrl'>
            {(field) => (
              <FormInput
                id={field.name}
                name={field.name}
                label='Site URL (optional)'
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
                error={field.state.meta.errors?.[0]}
                type='url'
                placeholder='https://example.com'
              />
            )}
          </form.Field>

          <div className='flex flex-row mt-4'>
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
                <Button type='submit' disabled={!canSubmit || createFeedMutation.isPending} className='flex-1'>
                  {createFeedMutation.isPending || isSubmitting ? 'Adding...' : 'Add Feed'}
                </Button>
              )}
            </form.Subscribe>
          </div>

          {createFeedMutation.error && (
            <p className='text-red-600 text-sm mt-2'>Failed to add feed. Please try again.</p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
