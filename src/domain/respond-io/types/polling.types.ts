export interface ContactChannel {
  id: number;
  name: string;
  source: string;
  lastMessageTime?: number;
}

export interface ContactInfo {
  id: number;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  channels: ContactChannel[];
}

export interface ContactState {
  contactInfo: ContactInfo;
  lastMessageId: number;
  lastPolledAt: Date;
}
