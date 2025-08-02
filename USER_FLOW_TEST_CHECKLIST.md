# User Flow Testing Checklist

## Phase 2: Customer Authentication Flow ✅

### Test Account Credentials
- **Email**: evanspaul87@gmail.com
- **Password**: Roshel6526. (note the period at the end)

### Authentication Tests
- [x] Login API works correctly
- [x] User profile exists and is active
- [x] Session is created successfully
- [x] Logout functionality works

## Phase 3: Complete Booking Flow Testing

### Prerequisites
1. Open browser to http://localhost:3000
2. Ensure dev server is running on port 3000

### Step-by-Step Testing

#### 1. Login Process
- [ ] Navigate to http://localhost:3000/auth/login
- [ ] Enter email: evanspaul87@gmail.com
- [ ] Enter password: Roshel6526.
- [ ] Click "Sign In"
- [ ] Verify redirect to /dashboard
- [ ] Verify welcome message shows "Paul"

#### 2. Dashboard Functionality
- [ ] Dashboard loads without errors
- [ ] Shows correct user name
- [ ] "New Booking" button is visible
- [ ] Navigation buttons work (Vehicles, Addresses, etc.)
- [ ] No bookings shown initially (clean state)

#### 3. Vehicle Management
- [ ] Click "Vehicles" from dashboard
- [ ] Should show empty state (no vehicles)
- [ ] Click "Add Vehicle" button
- [ ] Fill in vehicle details:
  - Make: BMW
  - Model: 3 Series
  - Year: 2022
  - Color: Black
  - Registration: AB12 CDE
  - Size: Medium
- [ ] Click "Add Vehicle"
- [ ] Verify vehicle appears in list
- [ ] Test edit functionality
- [ ] Test delete restrictions

#### 4. Address Management
- [ ] Navigate to /dashboard/addresses
- [ ] Should show empty state
- [ ] Click "Add Address"
- [ ] Fill in address:
  - Line 1: 123 Test Street
  - City: London
  - Postcode: SW1A 1AA
- [ ] Save address
- [ ] Verify address appears in list

#### 5. Booking Flow
- [ ] Click "New Booking" or navigate to /book
- [ ] **Step 1 - Service Selection**:
  - [ ] All services display with prices
  - [ ] Select "Full Valet"
  - [ ] Click "Continue"
  
- [ ] **Step 2 - Vehicle Details**:
  - [ ] Previously saved vehicle should appear
  - [ ] Select the vehicle
  - [ ] Click "Continue"
  
- [ ] **Step 3 - Time Slot Selection**:
  - [ ] Calendar displays
  - [ ] Available slots show (if admin created them)
  - [ ] Past slots are disabled
  - [ ] Select an available slot
  - [ ] Click "Continue"
  
- [ ] **Step 4 - Address Collection**:
  - [ ] Previously saved address appears
  - [ ] Select the address
  - [ ] Distance calculation works
  - [ ] Click "Continue"
  
- [ ] **Step 5 - User Details**:
  - [ ] Details pre-populated from profile
  - [ ] Phone number field works
  - [ ] Click "Continue"
  
- [ ] **Step 6 - Pricing Confirmation**:
  - [ ] Service price displays correctly
  - [ ] Vehicle size multiplier applied
  - [ ] Distance surcharge calculated
  - [ ] Total price is correct
  - [ ] Special instructions field works
  - [ ] Click "Confirm Booking"

#### 6. Post-Booking
- [ ] Booking confirmation displays
- [ ] Booking reference shown
- [ ] Return to dashboard
- [ ] New booking appears in dashboard
- [ ] Booking details page works

## Phase 4: New User Registration Flow

### Test Account
- **Email**: testuser_[timestamp]@example.com
- **Password**: TestPassword123!

### Registration Tests
- [ ] Navigate to /auth/register
- [ ] Fill in registration form
- [ ] Email confirmation (if required)
- [ ] Auto-login after registration
- [ ] Profile creation
- [ ] Complete booking flow as new user

## Known Issues to Test

1. **Mobile Responsiveness**
   - [ ] Test on mobile viewport (375px)
   - [ ] PWA bottom navigation visible
   - [ ] All forms work on mobile

2. **Error Handling**
   - [ ] Invalid login credentials
   - [ ] Network errors
   - [ ] Form validation errors

3. **Edge Cases**
   - [ ] Booking without saved vehicle/address
   - [ ] Multiple vehicles/addresses
   - [ ] Quick rebooking functionality

## API Endpoints Status

✅ Working:
- Authentication (Supabase)
- Services API
- Vehicle Sizes API
- User Profile API

⚠️ Requires Cookie Auth:
- Customer Vehicles API
- Customer Addresses API
- Customer Bookings API
- Booking Creation API

## Notes

1. All customer APIs require cookie-based authentication (not Bearer tokens)
2. Ensure time slots are created in admin panel before testing booking flow
3. The password for evanspaul87@gmail.com has a period at the end: `Roshel6526.`
4. Vehicle sizes are UUID-based, not numeric IDs

## Next Steps

After completing manual testing:
1. Document any issues found
2. Test admin flow for managing bookings
3. Verify email notifications (if configured)
4. Test on different browsers
5. Performance testing with multiple bookings