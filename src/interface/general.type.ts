export enum InfoVariant {
  SUCCESS = 'success',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  PAYMENT = 'payment',
}

export enum OnlineStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}
export enum ERoles {
  SEEKER = 'seeker',
  EYES = 'eyes',
  COMMUNITY = 'community',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentModes {
  CASH = 'CASH',
  ONLINE = 'ONLINE',
}

export enum PaymentStatus {
  PAID = 'PAID',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
}

export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}
export enum EShare {
  FACEBOOK = 'facebook',
  WHATSAPP = 'whatsApp',
  MAIL = 'mail',
  LINK = 'link',
}

export enum NotificationType {
  BOOKING = 'BOOKING',
  PROPERTY = 'PROPERTY',
  REVIEW = 'REVIEW',
  INQUIRY = 'INQUIRY',
  PAYMENT = 'PAYMENT',
  MESSAGE = 'MESSAGE',
}

export interface INotificationItem {
  id: string | number;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  isRead: boolean;
}

export enum CMS_TYPE {
  TERM_AND_CONDITION = 'TERM_AND_CONDITION',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
}

export enum EStatusFeedbackType {
  BookingConfirmed = 'BookingConfirmed',
  BookingCancelled = 'BookingCancelled',
  LiveCompleted = 'LiveCompleted',
}

export enum EDocumentType {
  PASSPORT = 'passport',
  NATIONAL_ID = 'national_id',
  DRIVING_LICENSE = 'drivers_license',
}
