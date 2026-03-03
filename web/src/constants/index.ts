export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  WORKSPACE: (slug: string) => `/t/${slug}`,
  CHANNEL: (slug: string, channelId: string) => `/t/${slug}/c/${channelId}`,
  SETTINGS: (slug: string) => `/t/${slug}/settings`,
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  TENANT_ID: 'tenant_id',
};

export const USER_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;

export const CHANNEL_TYPES = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  DM: 'dm',
} as const;

export const PERMISSIONS = {
  MANAGE_MEMBERS: 'manage_members',
  CREATE_CHANNELS: 'create_channels',
  UPDATE_ROLES: 'update_roles',
} as const;

export const TOAST_DURATION = 5000;

export const DEBOUNCE_DELAY = 300;

export const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
