export enum UserStatus {
  ONLINE = 'Online',
  AWAY = 'Away',
  DND = 'DND', // Do Not Disturb
  OFFLINE = 'Offline',
  INVISIBLE = 'Invisible'
}

export interface User {
  uin: string;
  nickname: string;
  email: string;
  status: UserStatus;
  avatarId?: number;
  isBot?: boolean;
}

export interface Message {
  id: string;
  senderUin: string;
  receiverUin: string;
  text: string;
  timestamp: number;
  read: boolean;
}

export interface ChatSession {
  contactUin: string;
  messages: Message[];
  draft: string;
  isOpen: boolean;
  minimized: boolean;
}

// ICQ Sound Effect encoded (short "Uh-oh!" simulation)
export const UH_OH_SOUND = 'data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'; // Just a placeholder header, real implementation would use a real file or synth. We will use Web Audio API synthesis instead.
