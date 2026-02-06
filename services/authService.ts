import { UserProfile } from '../types';

const STORAGE_KEY = 'nippon_odyssey_user';

const DEFAULT_USER: UserProfile = {
  name: 'Viajero',
  email: '',
  photoUrl: '',
  isLoggedIn: false
};

export const getUserProfile = (): UserProfile => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading user", e);
  }
  return DEFAULT_USER;
};

export const loginWithGoogleMock = async (): Promise<UserProfile> => {
  // En una app real, aquí usaríamos Firebase Auth o Google Identity Services.
  // Simulamos un login exitoso.
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockUser: UserProfile = {
        name: 'Josep',
        email: 'josep@viajero.com',
        photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop',
        isLoggedIn: true
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
      resolve(mockUser);
    }, 1500);
  });
};

export const updateUserProfile = (profile: UserProfile) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
};

export const logout = () => {
  localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_USER;
};