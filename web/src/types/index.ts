export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  system_role: 'user' | 'system_admin';
  deactivated_at?: string | null;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export interface TenantMembership {
  user: User;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface TenantPermissions {
  role: string;
  permissions: {
    manage_members: boolean;
    create_channels: boolean;
    update_roles: boolean;
  };
}

export interface Channel {
  id: string;
  name: string;
  type: 'public' | 'private' | 'dm';
  is_private: boolean;
  unread_count?: number;
  last_read_message_id?: string | null;
}

export interface ChannelList {
  public: Channel[];
  private: Channel[];
  dms: Channel[];
}

export interface Reaction {
  id: string;
  emoji: string;
  user: {
    id: string;
    name: string;
  };
}

export interface Message {
  id: string;
  body: string;
  client_id?: string;
  user: {
    id: string;
    name: string;
    avatar_url?: string;
    deactivated_at?: string | null;
  };
  reactions?: Reaction[];
  edited_at?: string;
  deleted_at?: string;
  inserted_at: string;
  
  parent_id?: string | null;
  reply_count?: number;
  
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
}

export interface Invite {
  id: string;
  email: string;
  role: 'admin' | 'member';
  code: string;
  expires_at: string;
  accepted_at: string | null;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface ApiError {
  error: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}
