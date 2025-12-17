import {useState} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  type User,
  type CreateUserInput,
  type UpdateUserInput,
} from '@web/services';
import {Button} from '@web/components/ui/button';
import {CreateUserDialog} from './CreateUserDialog';
import {EditUserDialog} from './EditUserDialog';

export function UsersTable() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const {
    data: users,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['users']});
      setIsCreateDialogOpen(false);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({id, input}: {id: string; input: UpdateUserInput}) => updateUser(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['users']});
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['users']});
      setUserToDelete(null);
    },
  });

  const handleCreateUser = (input: CreateUserInput) => {
    createUserMutation.mutate(input);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = (id: string, input: UpdateUserInput) => {
    updateUserMutation.mutate({id, input});
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <div className='text-center py-8'>
        <p className='text-gray-600'>Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center py-8'>
        <p className='text-red-600'>Error loading users. Please try again.</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h2 className='text-xl font-semibold'>Users</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>Add New User</Button>
      </div>

      <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
        <table className='w-full'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Name
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Email
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Email Integration
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Created
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {users?.users?.map((user: User) => (
              <tr key={user.id} className='hover:bg-gray-50'>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm font-medium text-gray-900'>{user.name}</div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>{user.email}</div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='flex items-center gap-2'>
                    <div
                      className={`w-2 h-2 rounded-full ${user.emailIntegrationEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                    ></div>
                    <span className='text-sm text-gray-500'>
                      {user.emailIntegrationEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-500'>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='flex space-x-2'>
                    <Button size='sm' variant='outline' onClick={() => handleEditUser(user)}>
                      Edit
                    </Button>
                    <Button size='sm' variant='destructive' onClick={() => handleDeleteUser(user)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users?.users?.length === 0 && (
          <div className='text-center py-8'>
            <p className='text-gray-500'>No users found.</p>
          </div>
        )}
      </div>

      <CreateUserDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateUser}
        isLoading={createUserMutation.isPending}
        error={createUserMutation.error}
      />

      <EditUserDialog
        isOpen={isEditDialogOpen}
        user={selectedUser}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={handleUpdateUser}
        isLoading={updateUserMutation.isPending}
        error={updateUserMutation.error}
      />

      {userToDelete && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md mx-4'>
            <h3 className='text-lg font-semibold mb-4'>Confirm Delete</h3>
            <p className='text-gray-600 mb-6'>
              Are you sure you want to delete user "{userToDelete.name}"? This action cannot be
              undone.
            </p>
            <div className='flex gap-3'>
              <Button variant='outline' onClick={() => setUserToDelete(null)} className='flex-1'>
                Cancel
              </Button>
              <Button
                variant='destructive'
                onClick={confirmDeleteUser}
                disabled={deleteUserMutation.isPending}
                className='flex-1'
              >
                {deleteUserMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
