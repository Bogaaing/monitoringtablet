export type Role = 'admin' | 'pic' | 'manager';

export type TabletStatus = 'active' | 'maintenance' | 'inactive' | 'lost';

export type InspectionStatus = 'pending' | 'approved' | 'rejected';

export type PhotoType = 'front' | 'back' | 'screen' | 'accessory';

export interface Location {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  description?: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  auth_id?: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  location_id?: string | null;
  location?: Location | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tablet {
  id: string;
  qr_code: string; // Tablet Code
  serial_number: string;
  brand: string;
  model: string;
  location_id?: string | null;
  location?: Location | null;
  status: TabletStatus;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type PeriodStatus = 'draft' | 'active' | 'closed' | 'archived';

export interface InspectionPeriod {
  id: string;
  name: string;
  year: number;
  month: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  status: PeriodStatus;
  created_at: string;
  updated_at: string;
}

export interface InspectionPhoto {
  id: string;
  inspection_id: string;
  photo_url: string;
  photo_type: PhotoType;
  uploaded_at: string;
}

export interface Inspection {
  id: string;
  period_id: string;
  period?: InspectionPeriod | null;
  tablet_id: string;
  tablet?: Tablet | null;
  pic_id: string;
  pic?: User | null;
  status: InspectionStatus;
  notes?: string | null;
  rejection_reason?: string | null;
  submitted_at: string;
  reviewed_at?: string | null;
  reviewer_id?: string | null;
  reviewer?: User | null;
  photos?: InspectionPhoto[];
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string | null;
  user?: User | null;
  action: string;
  details?: Record<string, any> | null;
  created_at: string;
}

export interface PaginationParams {
  search?: string;
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  locationId?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
