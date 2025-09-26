
import { create } from 'zustand';

export type UserRole = 'admin' | 'worker' | 'tenant';

export type User = {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  // Note: These are property IDs the worker is *primarily* responsible for, 
  // but they can also be assigned to other properties ad-hoc.
  assignedPropertyIds?: string[];
};

export const adminUser: User = {
  id: 'user-admin',
  name: 'Admin User',
  role: 'admin',
  email: 'admin@example.com',
};

export const workerUser: User = {
  id: 'user-worker-1',
  name: 'Bob the Builder',
  role: 'worker',
  email: 'bob@example.com',
  assignedPropertyIds: ['prop-1', 'prop-2', 'prop-8'],
};

export const tenantUser: User = {
    id: 'ten-1', // Corresponds to Alice Johnson
    name: 'Alice Johnson',
    role: 'tenant',
    email: 'alice.j@example.com',
}

interface CurrentUserState {
  user: User;
  setUser: (user: User) => void;
}

export const useCurrentUser = create<CurrentUserState>((set) => ({
  user: adminUser, // Default to admin
  setUser: (user) => set({ user }),
}));

    