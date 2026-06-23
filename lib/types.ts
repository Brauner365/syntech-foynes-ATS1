export type UserRole = "recruiter" | "client"

export type PipelineStage =
  | "submitted" | "reviewing" | "interview"
  | "offer" | "placed" | "rejected" | "withdrawn"

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  department?: string
  is_active: boolean
  created_at: string
}

export interface Vacancy {
  id: number
  job_ref: string
  title: string
  location: string
  quantity: number
  filled: number
  status: "active" | "paused" | "filled" | "cancelled"
  priority: number
  opened_date: string
  recruiter: string
  client_contact: string
  notes?: string
  created_at: string
  updated_at: string
  // derived
  pipeline_count?: number
  days_open?: number
}

export interface Candidate {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  location?: string
  nationality?: string
  trade?: string
  certifications: string[]
  right_to_work: boolean
  cv_url?: string
  cv_filename?: string
  linkedin_url?: string
  notes?: string
  added_by?: string
  created_at: string
  updated_at: string
}

export interface PipelineEntry {
  id: string
  vacancy_id: number
  candidate_id: string
  stage: PipelineStage
  stage_notes?: string
  interview_date?: string
  start_date?: string
  rate?: string
  added_by?: string
  moved_by?: string
  stage_updated_at: string
  created_at: string
  candidate?: Candidate
  vacancy?: Vacancy
}

export interface PipelineComment {
  id: string
  pipeline_id: string
  author_id?: string
  author_name: string
  author_role: UserRole
  comment: string
  created_at: string
}

export const STAGE_CONFIG: Record<PipelineStage, { label: string; color: string; bg: string; border: string }> = {
  submitted:  { label: "Submitted",  color: "text-blue-700",  bg: "bg-blue-50",   border: "border-blue-200" },
  reviewing:  { label: "Reviewing",  color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
  interview:  { label: "Interview",  color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
  offer:      { label: "Offer",      color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  placed:     { label: "Placed",     color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200" },
  rejected:   { label: "Rejected",   color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200" },
  withdrawn:  { label: "Withdrawn",  color: "text-gray-600",   bg: "bg-gray-50",   border: "border-gray-200" },
}

export const LOCATIONS = ["Limerick", "Dublin", "Tarbert", "Cavan", "TBC"]
export const TRADES = [
  "Coded Carbon Steel Pipe Welder", "Coded Welder", "Stick Welder (SMAW)",
  "Stainless Steel Fabricator", "Plater", "Carbon Steel Pipefitter",
  "Heavy Industrial Fitter", "Storage Tank Supervisor", "General Operative"
]
export const CERTIFICATIONS = [
  "Safe Pass", "CSCS Gold", "CSCS Blue", "Manual Handling",
  "Working at Height", "Weld Cert (6G)", "Weld Cert (5G)",
  "CSWIP 3.1", "PPS Number", "RCT Registered"
]
