# Docker Setup for Love4Detailing

This Docker setup provides a complete local development environment with PostgreSQL database and Supabase-compatible services.

## Quick Start

1. **Start the Docker services:**
   ```bash
   docker-compose up -d
   ```

2. **Copy the Docker environment variables:**
   ```bash
   cp .env.docker .env.local
   ```

3. **Wait for services to initialize** (about 30-60 seconds)

4. **Access the services:**
   - **App**: http://localhost:3000 (your Next.js app)
   - **Database API**: http://localhost:3001 (PostgREST)
   - **Auth Service**: http://localhost:9999 (GoTrue)
   - **Database UI**: http://localhost:3002 (Supabase Studio)

## Services Overview

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Main database |
| PostgREST | 3001 | Database API |
| GoTrue | 9999 | Authentication service |
| Studio | 3002 | Database management UI |

## Database Setup

The Docker setup automatically:
- Creates the `love4detailing` database
- Sets up Supabase-compatible roles and permissions
- Loads your database schema from `supabase-schema.sql`
- Creates the missing `reschedule_booking()` function
- Sets up proper authentication and RLS policies

## Testing the Reschedule Bug

With Docker running, you can:

1. **Create test bookings** through the app
2. **Reschedule bookings** using both admin and customer interfaces
3. **Check database state** directly via Studio at http://localhost:3002
4. **View time slot availability** in real-time
5. **Debug SQL queries** and transactions

## Database Access

### Via Studio (Recommended)
- Open http://localhost:3002
- Use the built-in query editor and table browser

### via psql
```bash
# Connect directly to the database
docker exec -it love4detailing-db psql -U postgres -d love4detailing

# Example queries to debug reschedule issues:
SELECT id, booking_reference, scheduled_date, scheduled_start_time, time_slot_id, status 
FROM bookings 
WHERE scheduled_date IN ('2025-08-04', '2025-08-05');

SELECT id, slot_date, start_time, is_available 
FROM time_slots 
WHERE slot_date IN ('2025-08-04', '2025-08-05')
ORDER BY slot_date, start_time;
```

## Environment Variables

The `.env.docker` file contains:
- Local database connection strings
- Test JWT tokens (for development only)
- Supabase service URLs pointing to local containers

## Debugging the Reschedule Issue

With this setup, you can:

1. **Reproduce the bug** by rescheduling bookings
2. **Check database state** before and after reschedule operations
3. **Test the new reschedule_booking() function** 
4. **Verify time slot availability logic**
5. **Monitor SQL queries** in real-time

## Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v
```

## Troubleshooting

### Database Connection Issues
- Ensure ports 5432, 3001, 3002, 9999 are available
- Check `docker-compose logs postgres` for database errors

### Schema Loading Issues  
- Check `docker-compose logs` for initialization errors
- Verify `supabase-schema.sql` is valid SQL

### Authentication Issues
- Ensure JWT secrets match between services
- Check GoTrue logs: `docker-compose logs supabase-auth`

This Docker setup will give you complete control over the database to properly debug and fix the reschedule booking issues!