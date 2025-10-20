# Talent Pool Database Migrations

**Created:** October 20, 2025  
**Purpose:** Database schema for client talent pool and interview management system

---

## Overview

This migration creates the database infrastructure for the talent pool feature, which allows clients to browse candidates from the BPOC database, request interviews, and provide hiring feedback.

---

## Files

### `CREATE-TALENT-POOL-TABLES.sql`

Creates three main tables with supporting indexes and triggers:

1. **interview_requests** - Client interview requests
2. **scheduled_interviews** - Confirmed interviews with Daily.co rooms
3. **interview_outcomes** - Client feedback and hiring decisions

Also creates:
- 3 enum types (interview_request_status, scheduled_interview_status, interview_decision)
- 15 performance indexes
- 3 auto-update triggers for `updated_at` timestamps

---

## How to Run

### Development (Local Supabase)
```bash
psql -d [LOCAL_DB_URL] -f migrations/talent-pool/CREATE-TALENT-POOL-TABLES.sql
```

### Production (Supabase Cloud)
```bash
psql -d [PRODUCTION_DB_URL] -f migrations/talent-pool/CREATE-TALENT-POOL-TABLES.sql
```

Or run via Supabase Dashboard SQL Editor:
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Paste contents of `CREATE-TALENT-POOL-TABLES.sql`
4. Click "Run"

---

## Dependencies

- Existing `client_users` table (foreign key dependency)
- PostgreSQL 12+ (for gen_random_uuid())
- BPOC database connection (Railway) - separate database

---

## Verification

After running the migration, verify with:

```sql
-- Check tables were created
SELECT tablename FROM pg_tables 
WHERE tablename IN ('interview_requests', 'scheduled_interviews', 'interview_outcomes');

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('interview_requests', 'scheduled_interviews', 'interview_outcomes');

-- Check enums
SELECT enumtypid::regtype, enumlabel 
FROM pg_enum 
WHERE enumtypid::regtype::text LIKE '%interview%';
```

Expected output:
- 3 tables
- 15 indexes
- 3 enum types with their values

---

## Rollback

To remove these tables (⚠️ **WARNING: Destructive**):

```sql
DROP TABLE IF EXISTS interview_outcomes CASCADE;
DROP TABLE IF EXISTS scheduled_interviews CASCADE;
DROP TABLE IF EXISTS interview_requests CASCADE;

DROP TYPE IF EXISTS interview_decision CASCADE;
DROP TYPE IF EXISTS scheduled_interview_status CASCADE;
DROP TYPE IF EXISTS interview_request_status CASCADE;

DROP FUNCTION IF EXISTS update_talent_pool_updated_at CASCADE;
```

---

## Schema Details

### interview_requests

Stores client requests to interview candidates from BPOC database.

**Key Fields:**
- `bpoc_candidate_id` - UUID from external BPOC database
- `preferred_times` - JSONB array of datetime preferences
- `status` - pending → scheduled/approved/rejected

**Indexes:**
- client_user_id, bpoc_candidate_id, status, created_at

### scheduled_interviews

Stores confirmed interviews with Daily.co video room details.

**Key Fields:**
- `interview_request_id` - Links back to original request
- `scheduled_time` - Final agreed time
- `daily_co_room_url` - Video interview link
- `status` - scheduled → completed/cancelled/no_show

**Indexes:**
- interview_request_id, client_user_id, bpoc_candidate_id, scheduled_time, status

### interview_outcomes

Stores client feedback and hiring decisions after interviews.

**Key Fields:**
- `scheduled_interview_id` - Links to interview
- `decision` - hire/reject/needs_review
- `client_feedback` - Required feedback text
- `admin_notes` - Optional internal notes

**Indexes:**
- scheduled_interview_id, client_user_id, bpoc_candidate_id, decision, created_at

---

## Notes

- All tables have auto-updating `updated_at` timestamps via triggers
- Foreign keys cascade on DELETE to maintain referential integrity
- JSONB is used for `preferred_times` to allow flexible array storage
- UUID v4 generated automatically for all primary keys
- Created and updated timestamps use `TIMESTAMP WITH TIME ZONE`

---

## Related Code

**Backend APIs:**
- `/app/api/client/interviews/request/route.ts`
- `/app/api/admin/interviews/schedule/route.ts`
- `/app/api/client/interviews/[id]/outcome/route.ts`

**Frontend Pages:**
- `/app/client/interviews/page.tsx`
- `/app/admin/interviews/requests/page.tsx`
- `/app/admin/interviews/outcomes/page.tsx`

---

**Last Updated:** October 20, 2025

