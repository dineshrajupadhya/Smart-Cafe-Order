export function getAuthToken(): string | null {
  return localStorage.getItem('cafeteria_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('cafeteria_token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('cafeteria_token');
}
