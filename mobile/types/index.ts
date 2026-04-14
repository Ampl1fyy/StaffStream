export type UserRole = 'worker' | 'business' | 'admin';
export type ShiftStatus = 'open' | 'filled' | 'active' | 'completed' | 'cancelled';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'maya' | 'gcash';
export type KYCStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  kyc_status: KYCStatus;
  reliability_score: number;
  average_rating: number;
  total_ratings: number;
  e_wallet_number?: string;
  e_wallet_provider?: PaymentMethod;
  is_active: boolean;
  created_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  industry?: string;
  logo_url?: string;
  address: string;
  city: string;
  is_verified: boolean;
  created_at: string;
}

export interface Skill {
  id: number;
  name: string;
  category: string;
}

export interface Shift {
  id: string;
  business_id: string;
  title: string;
  description?: string;
  role_required: string;
  skill_id?: number;
  slots: number;
  slots_filled: number;
  hourly_rate: number;
  time_start: string;
  time_end: string;
  status: ShiftStatus;
  address: string;
  qr_code?: string;
  created_at: string;
  // joined
  businesses?: Business;
  skills?: Skill;
  distance_meters?: number;
}

export interface Application {
  id: string;
  shift_id: string;
  worker_id: string;
  status: ApplicationStatus;
  checked_in_at?: string;
  checked_out_at?: string;
  hours_worked?: number;
  created_at: string;
  // joined
  shifts?: Shift;
  profiles?: Profile;
}

export interface Transaction {
  id: string;
  application_id: string;
  worker_id: string;
  business_id: string;
  amount: number;
  platform_fee: number;
  net_amount: number;
  payment_method: PaymentMethod;
  status: TransactionStatus;
  payment_reference?: string;
  initiated_at: string;
  completed_at?: string;
}

export interface Rating {
  id: string;
  application_id: string;
  rater_id: string;
  rated_id: string;
  score: number;
  comment?: string;
  created_at: string;
}

export interface Dispute {
  id: string;
  application_id: string;
  raised_by: string;
  reason: string;
  description?: string;
  status: 'open' | 'under_review' | 'resolved' | 'dismissed';
  resolution_note?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}
