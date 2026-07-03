export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatarUrl: string | null;
}

const DEV_USER: User = {
  id: 'dev',
  name: 'Active Scout',
  email: 'devopenspot@gmail.com',
  initials: 'OS',
  avatarUrl: null,
};

export function getCurrentUser(): User {
  return DEV_USER;
}
