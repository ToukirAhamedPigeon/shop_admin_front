// src/modules/mail/types/index.ts
export interface Mail {
  id: number;
  fromMail: string;
  toMail: string;
  ccMail?: string;
  bccMail?: string;
  subject: string;
  body: string;
  moduleName?: string;
  purpose?: string;
  attachments: string[];
  isSent: boolean;
  isReceived: boolean;
  isRead: boolean;
  isStarred: boolean;
  isTrash: boolean;
  sentAt?: string;
  receivedAt?: string;
  mailType?: string;
  parentMailId?: number;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MailDetail extends Mail {
  replies: Mail[];
  inReplyTo?: string;
  messageId?: string;
}

export interface MailStatistics {
  totalSent: number;
  totalReceived: number;
  unreadCount: number;
  starredCount: number;
  trashCount: number;
}

export interface MailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  description?: string;
  isGlobal: boolean;
  createdByName?: string;
  createdAt: string;
}

export interface SendMailRequest {
  toMail: string;
  ccMail?: string;
  bccMail?: string;
  subject: string;
  body: string;
  moduleName?: string;
  purpose?: string;
  attachments?: File[];
  parentMailId?: number;
  mailType?: string;
}

export type MailboxType = 'inbox' | 'sent' | 'starred' | 'trash';

export interface MailFilterRequest {
  q?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  mailbox?: MailboxType;
  fromDate?: string;
  toDate?: string;
  mailType?: string;
  purpose?: string;
  isRead?: boolean;
  isStarred?: boolean;
}