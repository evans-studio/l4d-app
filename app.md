Database Relationship Flow: From User Creation to Booking (Complete Schema)
1. User Creation Flow
mermaidgraph TD
    A[Customer fills booking form] --> B[System creates auth.users entry]
    B --> C[Trigger creates user_profiles entry]
    C --> D[Customer data ready for relationships]
    D --> E[Welcome email sent with temp password]
Tables Involved:

auth.users (Supabase auth schema) → user_profiles (public schema)

Relationship: One-to-One (user_profiles.id = auth.users.id)
The user_profiles table extends Supabase auth with app-specific fields: email, first_name, last_name, phone, role (customer/admin/super_admin), is_active



2. Customer Data Collection During Booking
mermaidgraph LR
    A[user_profiles] --> B[customer_vehicles]
    A --> C[customer_addresses]
    A --> D[bookings]
    A --> E[user_notification_settings]
Key Relationships:
user_profiles → customer_vehicles

Type: One-to-Many
Foreign Key: customer_vehicles.user_id → user_profiles.id
Fields: make, model, year, color, license_plate, registration, notes, is_primary, is_default
Links to vehicle_sizes for pricing multiplier

user_profiles → customer_addresses

Type: One-to-Many
Foreign Key: customer_addresses.user_id → user_profiles.id
Fields: address_line_1, address_line_2, city, postal_code, county, country, latitude, longitude, distance_from_business, is_primary, is_default

user_profiles → user_notification_settings

Type: One-to-One
Foreign Key: user_notification_settings.user_id → auth.users.id
Controls: email_bookings, email_reminders, sms_bookings

3. The Booking Creation Process
mermaidgraph TD
    A[Customer submits booking] --> B[Create/Select Vehicle]
    B --> C[Create/Select Address]
    C --> D[Select Service]
    D --> E[Select Time Slot]
    E --> F[Create Booking Record]
    F --> G[Create booking_services entries]
    G --> H[Send Confirmation Email]
    H --> I[Update confirmation_sent_at]
Core Booking Relationships:
bookings table is the central hub with extensive fields:

booking_reference (unique identifier)
customer_id → user_profiles.id (who is booking)
vehicle_id → customer_vehicles.id (which vehicle)
address_id → customer_addresses.id (where to service)
service_id → services.id (what service)
time_slot_id → time_slots.id (when)
Pricing: base_price, vehicle_size_multiplier, distance_surcharge, total_price, pricing_breakdown (JSONB)
Scheduling: scheduled_date, scheduled_start_time, scheduled_end_time, estimated_duration
Status tracking: status, payment_status, payment_method, payment_reference
Notes: special_instructions, internal_notes, admin_notes
Timestamps: created_at, updated_at, confirmed_at, completed_at, cancelled_at

bookings → booking_services

Type: One-to-Many
Foreign Key: booking_services.booking_id → bookings.id
Stores: service_id, service_details (JSONB snapshot), price, estimated_duration

4. Service and Pricing Structure
mermaidgraph TD
    A[service_categories] --> B[services]
    B --> C[booking_services]
    D[vehicle_sizes] --> E[customer_vehicles]
    E --> F[Price Calculation]
    F --> G[Booking Total Price]
Service Relationships:
service_categories → services

Fields: name, description, display_order, is_active

services (extensive service details):

Fields: name, slug, short_description, full_description, base_price, duration_minutes
Flags: is_mobile_only, requires_water_source, requires_power_source
Config: max_vehicles_per_slot, display_order, is_active

vehicle_sizes → customer_vehicles

Fields: name, description, price_multiplier, examples (array), display_order
Affects final pricing through multiplier

5. Time Slot Management
mermaidgraph TD
    A[Admin creates time_slots] --> B[Available for booking]
    B --> C[Customer books slot]
    C --> D[time_slot linked to booking]
    D --> E[Slot marked unavailable]
    F[Admin can add notes to slots]
Time Slot Relationship:
time_slots structure:

Fields: slot_date, start_time, is_available, notes, created_by
created_by → user_profiles.id (tracks which admin created it)
When bookings.time_slot_id is set, that slot is effectively booked

6. Booking Confirmation & Communication Flow
mermaidgraph TD
    A[Booking Created] --> B[Check notification_settings]
    B --> C{Email enabled?}
    C -->|Yes| D[Send Confirmation Email]
    D --> E[Log confirmation_sent_at]
    C -->|SMS enabled?| F[Send SMS Confirmation]
    F --> G[Log confirmation details]
    H[24hr before] --> I[Send Reminder]
    J[Status Changes] --> K[Send Update Email]
Confirmation Process:

Booking created with all details
System checks user_notification_settings preferences
Sends email confirmation with booking reference, details, and confirmation link
Updates bookings.confirmation_sent_at timestamp
Optional: Customer clicks confirmation link → updates confirmed_at
Automatic reminder sent 24 hours before appointment (if enabled)

7. Booking Lifecycle & History Tracking
mermaidgraph TD
    A[Booking Created] --> B[booking_status_history entry]
    B --> C[Status Changes]
    C --> D[New history entry]
    E[booking_messages] --> A
    F[booking_history] --> A
    G[Cancellation] --> H[Update cancelled_at/by]
Audit Trail Tables:
bookings → booking_status_history

Tracks: from_status, to_status, changed_by, reason, notes, created_at
Every status change is logged

bookings → booking_messages

Fields: sender_id, recipient_id, message_type, subject, message, is_internal, read_at
Enables customer-admin communication

bookings → booking_history

Fields: action, details (JSONB), created_by, created_at
General audit log for all booking modifications

8. Complete Relationship Map
sql-- User Authentication & Profile
auth.users (id) <--1:1--> user_profiles (id)
auth.users (id) <--1:N--> user_notification_settings (user_id)

-- Customer Information
user_profiles (id) <--1:N--> customer_vehicles (user_id)
user_profiles (id) <--1:N--> customer_addresses (user_id)
user_profiles (id) <--1:N--> bookings (customer_id)

-- Vehicle Information
vehicle_sizes (id) <--1:N--> customer_vehicles (vehicle_size_id)

-- Service Structure
service_categories (id) <--1:N--> services (category_id)

-- Booking Core
bookings (id) -->N:1--> user_profiles (customer_id)
bookings (id) -->N:1--> services (service_id)
bookings (id) -->N:1--> customer_vehicles (vehicle_id)
bookings (id) -->N:1--> customer_addresses (address_id)
bookings (id) -->N:1--> time_slots (time_slot_id)

-- Booking Details
bookings (id) <--1:N--> booking_services (booking_id)
booking_services (id) -->N:1--> services (service_id)

-- Booking History & Communication
bookings (id) <--1:N--> booking_status_history (booking_id)
bookings (id) <--1:N--> booking_messages (booking_id)
bookings (id) <--1:N--> booking_history (booking_id)

-- Admin/User Actions
user_profiles (id) <--1:N--> booking_history (created_by)
user_profiles (id) <--1:N--> booking_status_history (changed_by)
user_profiles (id) <--1:N--> bookings (cancelled_by)
user_profiles (id) <--1:N--> time_slots (created_by)

-- Security & Auth Tracking (if needed)
auth.users (id) <--1:N--> security_events (user_id)
auth.sessions (id) <--1:N--> user_sessions (supabase_session_id)
user_sessions (id) <--1:N--> refresh_token_usage (session_id)
9. Typical Data Flow Examples
New Customer Books:

Create auth.users → triggers user_profiles creation
Insert customer_vehicles (links to user_profiles.id and vehicle_sizes.id)
Insert customer_addresses (links to user_profiles.id)
Insert bookings (links all IDs together, calculates pricing)
Insert booking_services (captures service details at booking time)
Update time_slots.is_available = false
Insert booking_status_history (status: 'pending')
Check user_notification_settings
Send confirmation email with booking details
Update confirmation_sent_at timestamp
Schedule reminder for 24 hours before appointment

Returning Customer Books:

Fetch user's existing vehicles and addresses
Customer selects existing or creates new
Create new booking with existing IDs
Same process for services, time slots, and confirmations
Email includes option to manage preferences via dashboard

Admin Manages Booking:

Admin views booking with all related data
Can add internal notes or booking_messages
Status changes logged in booking_status_history
Customer notified of any changes per their notification preferences