import { getCurrentUser, type User } from '@/lib/user';

export type { User };

export function useUser(): User {
  return getCurrentUser();
}
