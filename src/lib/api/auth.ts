// Temporary auth utility for API routes
export interface UserProfile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  role: string
}

export interface AuthenticatedRequest {
  user: {
    id: string
    email: string
  }
  profile: UserProfile
}