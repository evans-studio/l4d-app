// Simple auth utilities for API routes
export { AuthHandler as auth } from './auth-handler'

// For backward compatibility
export const getUser = (request: any) => {
  const { AuthHandler } = require('./auth-handler')
  return AuthHandler.getUserFromHeaders(request) || AuthHandler.getUserFromRequest(request)
}