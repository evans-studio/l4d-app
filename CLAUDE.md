# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Love4Detailing Build System & Architecture Principles

### Core Architecture Foundation

#### Technology Stack (Immutable)
- **Framework**: Next.js 14 with App Router - no pages directory usage
- **Language**: TypeScript with strict mode - no any types allowed
- **Database**: Supabase PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth with role-based access control
- **State Management**: Zustand with domain-specific stores
- **Styling**: Tailwind CSS with CVA (class-variance-authority)
- **Component System**: Primitives-based architecture only
- **Testing**: Jest with environment-specific configurations

### Development Principles

#### 1. Phase-Based Development
- Complete each phase fully before proceeding
- No mixing of phases or jumping ahead
- Each phase has clear deliverables and success criteria
- Document completion before moving forward

#### 2. Single Source of Truth
- Database schema is the ultimate truth for data structure
- `database.types.ts` generated from Supabase defines all types
- No creating types that conflict with database reality
- API responses must match database relationships

#### 3. Consistency Over Convenience
- Follow established patterns even if shortcuts exist
- Every API uses the same response format
- Every component uses the same primitive system
- Every store follows the same structure

### Architectural Standards

#### API Response Format (Mandatory)
```typescript
{
  success: boolean
  data?: T
  error?: { 
    message: string
    code?: string 
  }
  metadata?: {
    pagination?: {...}
    timestamp?: string
  }
}
```
**No exceptions. Every API endpoint returns this structure.**

#### Component Architecture Rules
- Use components from `/components/ui/` - primitives, composites, and patterns
- Never use HTML elements directly - no `<button>`, use `<Button>`
- Compound components for complex UI patterns
- Consistent prop interfaces across similar components
- Dark theme by default with consistent color tokens

#### State Management Patterns
- Domain separation - `authStore`, `bookingStore`, `vehicleStore`, etc.
- Data transformation layer - API → Transform → Store
- No direct API response storage - always transform first
- Unified persistence with environment-aware policies
- Clear action naming - `fetchBookings`, `updateBooking`, `clearBookings`

#### Database Access Patterns
- Joins for related data - Don't make multiple queries
- Select only needed fields - Avoid `select('*')` in production
- Consistent naming - `snake_case` in DB, `camelCase` in frontend
- Proper TypeScript types - Use generated database types
- Transaction safety - Wrap related operations

## Code Organization

### Directory Structure
```
/src
  /app                    # Next.js app router pages
    /api                  # API routes with standardized responses
    /(auth)              # Grouped auth-related pages
    /admin               # Admin dashboard pages
    /book                # Booking flow pages
    /dashboard           # Customer dashboard pages
  /components            
    /ui/primitives       # Base component library
    /ui/composites       # Compound components
    /ui/patterns         # Complex UI patterns
    /admin              # Admin-specific components
    /booking            # Booking flow components
    /customer           # Customer dashboard components
    /layout             # Layout components
  /lib
    /api                # API utilities and wrappers
    /auth               # Authentication utilities
    /db                 # Database utilities and types
    /store              # Zustand stores
    /transforms         # Data transformation functions
    /utils              # General utilities
  /hooks                # Custom React hooks
  /types                # TypeScript type definitions
```

### Naming Conventions
- **Files**: kebab-case (`booking-form.tsx`)
- **Components**: PascalCase (`BookingForm`)
- **Functions**: camelCase (`fetchUserBookings`)
- **Constants**: UPPER_SNAKE_CASE (`API_ROUTES`)
- **Types/Interfaces**: PascalCase with descriptive names
- **Database**: snake_case for tables and columns

## Data Flow Architecture

### Request Lifecycle
1. User Action → Component event handler
2. API Call → Standardized fetch with error handling
3. Response Validation → Check success flag
4. Data Transformation → Convert to frontend format
5. Store Update → Update Zustand store
6. UI Update → React re-render with new data

### Error Handling Hierarchy
- **Network Errors** → Show connection error message
- **API Errors** → Display specific error from response
- **Validation Errors** → Show field-specific messages
- **Unexpected Errors** → Generic message with error boundary

## Security Principles

### Authentication Flow
- **Public Routes** → No authentication required
- **Protected Routes** → Require valid session
- **Admin Routes** → Require admin or super_admin role
- **API Protection** → Middleware validates before handler

### Data Access Control
- **Row Level Security** → Database enforces access
- **Role Verification** → Check user role for operations
- **Data Isolation** → Users only see their own data
- **Admin Override** → Admins use service role carefully

## Performance Standards

### Build-Time Optimization
- **Bundle Size Limits** → 3MB production, 10MB development
- **Code Splitting** → Route-based automatic splitting
- **Tree Shaking** → Remove unused code
- **Image Optimization** → Next.js Image component

### Runtime Performance
- **API Response Time** → <500ms for production
- **Page Load Time** → <3s on 4G networks
- **Interaction Delay** → <100ms for user actions
- **Memory Usage** → Monitor for leaks

## Testing Philosophy

### Test Categories
- **Unit Tests** → Business logic and utilities
- **Integration Tests** → API endpoints with database
- **E2E Tests** → Critical user journeys
- **Performance Tests** → Load and response times

### Coverage Requirements
- **Business Logic**: 80% minimum
- **API Routes**: 100% for critical paths
- **UI Components**: Interaction testing required
- **Error Scenarios**: Must test failure cases

## Development Workflow

### Feature Implementation
1. **Understand Requirements** → Business need and user journey
2. **Check Existing Patterns** → Follow established solutions
3. **Design Data Flow** → API → Transform → Store → UI
4. **Implement with Types** → TypeScript-first development
5. **Test Thoroughly** → Unit and integration tests
6. **Document Decisions** → Why, not just what

### Code Review Checklist
- ✅ Follows API response format
- ✅ Uses UI components (primitives, composites, patterns) only
- ✅ Includes proper TypeScript types
- ✅ Handles errors appropriately
- ✅ Includes loading states
- ✅ Mobile responsive
- ✅ No console.logs in production code
- ✅ Proper data transformation

## Common Pitfalls to Avoid

### Anti-Patterns
- **Direct HTML usage** → Always use UI components
- **Any types** → Define proper interfaces
- **Inconsistent API responses** → Use standard format
- **Multiple API calls** → Use joins instead
- **Client-side data joins** → Do it in the database
- **Storing raw API responses** → Transform first
- **Ignoring TypeScript errors** → Fix them properly

### Schema Confusion
- Check database reality → Don't assume fields exist
- Use proper joins → Get related data correctly
- Transform nested data → Flatten for frontend use
- Respect data types → Date vs string vs timestamp

## Quality Gates

### Before Committing
- ✅ TypeScript compiles without errors
- ✅ ESLint passes with zero warnings
- ✅ Tests pass for affected code
- ✅ API responses follow standard format
- ✅ Components use UI library only

### Before Deployment
- ✅ All tests pass including E2E
- ✅ Build succeeds with production config
- ✅ Performance budgets are met
- ✅ Security headers are configured
- ✅ Environment variables are set correctly

## Decision Making Framework

When facing architectural decisions:
1. **Is there an established pattern?** → Use it
2. **Does it maintain consistency?** → Priority one
3. **Does it improve user experience?** → Consider it
4. **Does it add complexity?** → Question it
5. **Can it be simpler?** → Make it so

## Success Metrics

The system is successful when:
- **Patterns are predictable** → Developers know where to look
- **Errors are rare** → Quality gates catch issues
- **Performance is consistent** → Users have smooth experience
- **Maintenance is easy** → Code is self-documenting
- **Scaling is possible** → Architecture supports growth

## Common Development Commands

```bash
# Development
npm run dev                # Start dev server with session reset
npm run reset-session     # Reset user session
npm run build             # Production build
npm run start             # Production server

# Database
npm run reset-db          # Reset database
npm run setup-database    # Full database setup with seed data

# Testing
npm run test              # Run Jest tests
npm run test:email        # Test email functionality
```

---

**These build system and architecture principles are non-negotiable. They ensure consistency, quality, and maintainability throughout the Love4Detailing platform. Any deviation requires explicit justification and documentation.**