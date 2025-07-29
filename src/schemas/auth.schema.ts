import { z } from 'zod'

// Base schemas
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string().nullable(),
  role: z.enum(['customer', 'admin', 'super_admin']),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  email_confirmed_at: z.string().nullable(),
  user_metadata: z.record(z.string(), z.any()).optional(),
  app_metadata: z.record(z.string(), z.any()).optional(),
})

// Registration schemas
export const RegisterRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
})

export const LoginRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// API Response schemas
export const AuthResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    user: AuthUserSchema.optional(),
    profile: UserProfileSchema.optional(),
    redirectTo: z.string().optional(),
    message: z.string().optional(),
  }).optional(),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
  }).optional(),
  metadata: z.object({
    timestamp: z.string().optional(),
  }).optional(),
})

// Type exports
export type UserProfile = z.infer<typeof UserProfileSchema>
export type AuthUser = z.infer<typeof AuthUserSchema>
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>
export type LoginRequest = z.infer<typeof LoginRequestSchema>
export type AuthResponse = z.infer<typeof AuthResponseSchema>

// Helper functions
export const parseUserProfile = (data: unknown): UserProfile | null => {
  const result = UserProfileSchema.safeParse(data)
  return result.success ? result.data : null
}

export const parseAuthUser = (data: unknown): AuthUser | null => {
  const result = AuthUserSchema.safeParse(data)
  return result.success ? result.data : null
}