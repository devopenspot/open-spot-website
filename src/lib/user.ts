export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatarUrl: string | null;
}

export const DEV_USER_ID = 'dev';

const DEV_USER: User = {
  id: DEV_USER_ID,
  name: 'Active Scout',
  email: 'devopenspot@gmail.com',
  initials: 'OS',
  avatarUrl: null,
};

export function getCurrentUser(): User {
  return DEV_USER;
}
