export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
export type TicketCategory =
  | "IT"
  | "HR"
  | "MANAGEMENT"
  | "EQUIPMENT"
  | "STATION"
  | "SURROUNDINGS"
  | "COMPENSATION"
  | "TRANSPORT"
  | "ONBOARDING"
  | "OFFBOARDING"
  | "OTHER"
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"

export interface TicketResponse {
  id: string
  message: string
  createdByType: string
  createdAt: string
  attachments: string[]
  staffUser?: {
    id: string
    name: string
    email: string
    avatar?: string
    role: string
  }
  managementUser?: {
    id: string
    name: string
    email: string
    avatar?: string
    role: string
  }
}

export interface Ticket {
  id: string
  ticketId: string
  title: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  assignedTo: string | null
  attachments: string[]
  createdAt: string
  updatedAt: string
  resolvedDate: string | null
  createdByType: string
  managementUserId: string | null
  responses: TicketResponse[]
  staffUser?: {
    id: string
    name: string
    email: string
    avatar?: string
    role: string
  }
}

