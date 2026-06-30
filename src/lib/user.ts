export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
}

const DEV_USER: User = {
  id: 'dev',
  name: 'Active Scout',
  email: 'devopenspot@gmail.com',
  initials: 'OS',
};

export function getCurrentUser(): User {
  return DEV_USER;
}
