// ================================================================
// MentorSpace — Domain TypeScript Types
// ================================================================

// ── Enums / Unions ────────────────────────────────────────────────

export type MemberStatus = 'active' | 'left'
export type SpaceType = 'individual_seat' | 'complete_room'
export type SeatPlanType = 'morning' | 'evening' | 'dedicated'
export type PaymentStatus = 'pending' | 'partially_paid' | 'paid' | 'overdue'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'cheque' | 'online'
export type StaffStatus = 'active' | 'left'
export type StaffSalaryStatus = 'pending' | 'paid'
export type AdvanceStatus = 'outstanding' | 'partially_repaid' | 'cleared'
export type RoomType = 'private' | 'shared' | 'conference'
export type GeneratorExpenseType = 'fuel' | 'maintenance' | 'repair' | 'other'

// ── Physical Space ────────────────────────────────────────────────

export interface Room {
  id: string
  name: string
  description: string | null
  capacity: number
  room_type: RoomType
  monthly_rate: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  // joined
  current_member?: Member | null
  seat_count?: number
}

export interface Seat {
  id: string
  seat_number: string
  room_id: string | null
  description: string | null
  monthly_rate: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  // joined
  room?: Room | null
  current_member?: Member | null
}

export interface SeatWithShifts {
  id: string
  seat_number: string
  seat_index: number
  room_id: string | null
  description: string | null
  monthly_rate: number | null
  is_active: boolean
  morning_member?: {
    id: string
    full_name: string
    phone: string | null
    joining_date: string
    monthly_amount: number
    payment_status?: string
  } | null
  evening_member?: {
    id: string
    full_name: string
    phone: string | null
    joining_date: string
    monthly_amount: number
    payment_status?: string
  } | null
  dedicated_member?: {
    id: string
    full_name: string
    phone: string | null
    joining_date: string
    monthly_amount: number
    payment_status?: string
  } | null
  morning_available: boolean
  evening_available: boolean
  dedicated_available: boolean
}

// ── Members ───────────────────────────────────────────────────────

export interface Member {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  joining_date: string
  leaving_date: string | null
  status: MemberStatus
  space_type: SpaceType
  plan_type?: SeatPlanType | null
  assigned_seat_id: string | null
  assigned_room_id: string | null
  monthly_amount: number
  security_deposit: number
  deposit_refunded: boolean
  deposit_refund_date: string | null
  deposit_refund_amount: number | null
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  assigned_seat?: Seat | null
  assigned_room?: Room | null
  payments?: MemberPayment[]
}

// ── Member Payments ───────────────────────────────────────────────

export interface MemberPayment {
  id: string
  member_id: string
  billing_month: string   // ISO date '2025-01-01' (always 1st of month)
  amount_due: number
  amount_paid: number
  payment_status: PaymentStatus
  due_date: string
  payment_date: string | null
  payment_method: PaymentMethod | null
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  member?: Member
  transactions?: PaymentTransaction[]
  // computed
  remaining?: number
}

export interface PaymentTransaction {
  id: string
  payment_id: string
  amount: number
  paid_on: string
  payment_method: PaymentMethod | null
  notes: string | null
  created_at: string
}

// ── Staff ─────────────────────────────────────────────────────────

export interface Staff {
  id: string
  full_name: string
  phone: string | null
  joining_date: string
  leaving_date: string | null
  status: StaffStatus
  monthly_salary: number
  role: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  salaries?: StaffSalary[]
  advances?: StaffAdvance[]
  // computed
  outstanding_advances?: number
}

export interface StaffSalary {
  id: string
  staff_id: string
  billing_month: string
  base_salary: number
  advance_deducted: number
  net_paid: number
  payment_status: StaffSalaryStatus
  paid_on: string | null
  payment_method: PaymentMethod | null
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  staff?: Staff
}

export interface StaffAdvance {
  id: string
  staff_id: string
  advance_date: string
  amount: number
  reason: string | null
  amount_repaid: number
  remaining: number   // computed: amount - amount_repaid
  status: AdvanceStatus
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  staff?: Staff
}

// ── Expenses ──────────────────────────────────────────────────────

export interface ExpenseCategory {
  id: number
  name: string
  slug: string
  color: string
  is_system: boolean
  sort_order: number
  created_at: string
}

export interface Expense {
  id: string
  category_id: number
  expense_date: string
  amount: number
  description: string
  vendor: string | null
  payment_method: PaymentMethod | null
  receipt_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  category?: ExpenseCategory
}

// ── Grocery ───────────────────────────────────────────────────────

export interface GrocerySession {
  id: string
  session_date: string
  vendor: string | null
  total_amount: number
  notes: string | null
  expense_id: string | null
  created_at: string
  updated_at: string
  // joined
  items?: GroceryItem[]
}

export interface GroceryItem {
  id: string
  grocery_session_id: string
  item_name: string
  quantity: string | null
  unit_price: number | null
  total_price: number
  created_at: string
}

// ── Generator ─────────────────────────────────────────────────────

export interface GeneratorExpense {
  id: string
  expense_date: string
  type: GeneratorExpenseType
  fuel_liters: number | null
  cost_per_liter: number | null
  total_amount: number
  vendor: string | null
  description: string | null
  payment_method: PaymentMethod | null
  notes: string | null
  expense_id: string | null
  created_at: string
  updated_at: string
}

// ── App Settings ──────────────────────────────────────────────────

export interface AppSetting {
  key: string
  value: string
  label: string | null
  updated_at: string
}

export interface AppSettings {
  payment_due_day_start: string
  payment_due_day_end: string
  currency: string
  currency_symbol: string
  space_name: string
  overdue_auto_mark: string
}

// ── Dashboard / Aggregates ────────────────────────────────────────

export interface DashboardKPIs {
  // Space occupancy
  total_rooms: number
  total_seats: number           // 19 physical seats
  occupied_rooms: number
  occupied_seats: number
  available_rooms: number
  available_seats: number
  occupancy_percentage: number

  // Shift-based occupancy
  morning_occupied: number
  morning_available: number
  evening_occupied: number
  evening_available: number
  dedicated_occupied: number
  total_shift_slots: number     // 38 slots
  available_shift_slots: number

  // Members
  total_active_members: number

  // Revenue (for selected month)
  expected_revenue: number
  collected_revenue: number
  pending_revenue: number

  // Payments breakdown
  paid_members: number
  partially_paid_members: number
  pending_members: number
  overdue_members: number

  // Expenses (for selected month)
  total_expenses: number
  salary_expenses: number
  grocery_expenses: number
  electricity_expenses: number
  generator_expenses: number

  // P&L
  net_profit: number
}

export interface MonthlyPLData {
  month: string           // 'Jan 2025'
  billing_month: string   // '2025-01-01'
  expected_revenue: number
  collected_revenue: number
  total_expenses: number
  net_profit: number
}

export interface ExpenseBreakdownItem {
  category: string
  slug: string
  color: string
  amount: number
  percentage: number
}

// ── Form Values ───────────────────────────────────────────────────

export interface MemberFormValues {
  full_name: string
  phone: string
  email: string
  joining_date: string
  space_type: SpaceType
  plan_type: SeatPlanType
  assigned_seat_id: string
  assigned_room_id: string
  monthly_amount: number
  security_deposit: number
  notes: string
}

export interface RecordPaymentValues {
  amount: number
  paid_on: string
  payment_method: PaymentMethod
  notes: string
}

export interface StaffFormValues {
  full_name: string
  phone: string
  joining_date: string
  monthly_salary: number
  role: string
  notes: string
}

export interface AdvanceFormValues {
  advance_date: string
  amount: number
  reason: string
  notes: string
}

export interface ExpenseFormValues {
  category_id: number
  expense_date: string
  amount: number
  description: string
  vendor: string
  payment_method: PaymentMethod | ''
  notes: string
}

export interface GrocerySessionFormValues {
  session_date: string
  vendor: string
  notes: string
  items: {
    item_name: string
    quantity: string
    unit_price: number | null
    total_price: number
  }[]
}

export interface GeneratorExpenseFormValues {
  expense_date: string
  type: GeneratorExpenseType
  fuel_liters: number | null
  cost_per_liter: number | null
  total_amount: number
  vendor: string
  description: string
  payment_method: PaymentMethod | ''
  notes: string
}

export interface RoomFormValues {
  name: string
  description: string
  capacity: number
  room_type: RoomType
  monthly_rate: number | null
}

export interface SeatFormValues {
  seat_number: string
  room_id: string
  description: string
  monthly_rate: number | null
}

// ── Pagination ────────────────────────────────────────────────────

export interface PaginationParams {
  page: number
  per_page: number
}

export interface PaginatedResult<T> {
  data: T[]
  count: number
  page: number
  per_page: number
  total_pages: number
}
