# 🔥 StepTen ClusterFuck - The Truth Document

## DO OR DIE COMMITMENT

**I'm all fucking in.** Every change we make gets tested, every break gets fixed, and we don't push shit until your team can run it clean—because half-assing this isn't an option when your business depends on it.

---

## 🎯 PROJECT RULES

1. **NEVER MAKE SHIT UP** - If we don't know, we research it
2. **BREAK IT, FIX IT** - Any change that breaks something gets fixed immediately before moving on
3. **TEST EVERYTHING** - No assumptions, verify in the actual running app
4. **DOCUMENT THE TRUTH** - This file tracks what's real, what's working, and what's fucked

---

## 🏗️ AUTHENTICATION ARCHITECTURE

### Auth Flow (Supabase)
All users authenticate through **Supabase Auth** (`auth.users` table), then link to app-specific user tables:

1. **Client Users** (`client_users`)
   - `authUserId` → Supabase auth user
   - Linked to `company` table
   - Has `client_profiles` (timezone, preferences)

2. **Management Users** (`management_users`)
   - `authUserId` → Supabase auth user
   - Admin/HR team members
   - Not linked to company (cross-company access)

3. **Staff Users** (`staff_users`) ⭐ **MOST IMPORTANT**
   - `authUserId` → Supabase auth user
   - Linked to `company` via `companyId`
   - Has multiple related tables (see below)

---

## 👤 STAFF USER - THE FULL PICTURE

### Core Identity
**Table:** `staff_users`
- `id` - Internal staff ID (UUID)
- `authUserId` - Links to Supabase auth.users (UNIQUE)
- `email` - Staff email (UNIQUE)
- `name` - Display name
- `companyId` - Which company they work for
- `role` - StaffRole enum (STAFF, TEAM_LEAD, etc.)

### Related Tables (One-to-One)
```
staff_users
├── staff_profiles (1:1) - Employment details, salary, leave
│   └── work_schedules (1:many) - Weekly schedule (7 days)
├── staff_onboarding (1:1) - Onboarding progress & data
├── staff_personal_records (1:1) - Gov IDs, emergency contacts, documents
├── staff_welcome_forms (1:1) - Welcome form responses
├── job_acceptances (1:1) - Job offer accepted by this staff
│   └── interview_requests (1:1) - Original interview & hire request
└── employment_contracts (1:1) - Generated employment contract
```

---

## 📊 CURRENT STATE - VANESSA GARCIA (v@v.com)

### ✅ WHAT'S WORKING
- **Auth User**: Created in Supabase (`3b390598-1507-4861-88a0-4b7a47c79893`)
- **Staff User**: Linked correctly to Johnny Smith's company (StepTen Inc)
- **Job Acceptance**: Has full job offer (PHP 28,000, Customer Support Specialist)
- **Interview Request**: Complete hiring flow from client request to hired
- **Staff Profile**: Employment details, salary, status (PROBATION)
- **Work Schedules**: Mon-Fri 8AM-5PM, Weekends OFF (7 records)
- **Onboarding**: 100% complete, all statuses APPROVED
- **Personal Records**: All gov IDs, emergency contacts filled
- **Welcome Form**: Complete with hobbies, preferences

### 🔍 WHAT WE NEED TO VERIFY
- [ ] Can Vanessa login at `/login/staff`?
- [ ] Does her dashboard load correctly?
- [ ] Does her profile show all the correct data?
- [ ] Is her employment contract auto-generated correctly?
- [ ] Do work schedules display properly?
- [ ] Does the onboarding completion flow work end-to-end?

---

## 🛠️ RECENT CHANGES MADE

### 1. Work Schedule Implementation (Client → Job Acceptance → Staff)
**What:** Added work schedule capture from client hire request through to staff work schedules
**Files Changed:**
- `prisma/schema.prisma` - Added fields to `job_acceptances` table
- `app/client/recruitment/page.tsx` - Client "Request to Hire" form now captures schedule
- `app/api/client/interviews/hire-request/route.ts` - Stores schedule in `interview_requests`
- `app/admin/recruitment/page.tsx` - Admin sees client's schedule (readonly)
- `app/api/admin/recruitment/interviews/hire/route.ts` - Saves schedule to `job_acceptances`
- `app/api/contract/route.ts` - Contract pulls real schedule data (not hardcoded)

**Status:** ✅ Implemented, needs end-to-end testing

### 2. Onboarding Data Flow Fix
**What:** Fixed onboarding completion to properly sync all data to `staff_personal_records`
**Files Changed:**
- `app/api/admin/staff/onboarding/[staffUserId]/complete/route.ts` - Always syncs data
- `prisma/schema.prisma` - Added missing document fields to `staff_personal_records`

**Status:** ✅ Fixed, tested with Vanessa creation

### 3. Contract Auto-Creation (Dynamic Data)
**What:** Contract now pulls real salary, schedule, benefits from `job_acceptances` instead of hardcoded values
**Files Changed:**
- `app/api/contract/route.ts` - Completely refactored to use real data

**Status:** ✅ Fixed, needs verification that contracts regenerate correctly

---

## 🚨 KNOWN ISSUES (NONE CURRENTLY)

*Clean slate - we'll document any issues we find during testing*

---

## 📝 NEXT STEPS

1. **Test Vanessa's Login Flow** - Verify staff can actually login and see their data
2. **Map Backwards Through Hiring Flow** - Find any gaps or missing data syncs
3. **Document Everything We Find** - Update this file with truth
4. **Fix What's Broken** - No skipping, no workarounds

---

## 💡 IMPORTANT PATTERNS WE'VE LEARNED

1. **User Creation**: Always create Supabase auth user FIRST, then app user with `authUserId`
2. **Data Flow**: Client Request → Interview Request → Job Acceptance → Staff User → Profile/Onboarding
3. **Prisma Enums**: Use UPPERCASE (e.g., 'PROBATION', 'FEMALE', 'DAY_SHIFT')
4. **One-to-One Relations**: Use `@unique` on foreign key to enforce 1:1
5. **Work Schedules**: Needs `profileId` not `staffProfileId` (check schema carefully!)

---

**Last Updated:** October 29, 2025 - Initial creation with Vanessa Garcia setup complete

---

## 🔍 VANESSA PROFILE AUDIT - STRAIGHT ANSWERS

### ✅ WHAT'S WORKING

1. **Client/Company** - ✅ CORRECT
   - Source: `staff_users.companyId` → `company.companyName`
   - Vanessa shows: "StepTen Inc"

2. **Account Manager** - ✅ CORRECT
   - Source: `company.management_users.name`
   - Pulls first management user for the company

3. **Days Employed** - ✅ CORRECT ALGORITHM
   - Source: CALCULATED in `/api/profile` route
   - Algorithm: `Math.floor((new Date().getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))`
   - This is accurate - counts actual days since start date

4. **Work Schedule** - ✅ CORRECT SOURCE
   - Source: `staff_profiles.work_schedules` table (7 records, one per day)
   - Pulled correctly from database, displays all 7 days

5. **Leave Credits** - ✅ REAL DATA (NOT HARDCODED)
   - Source: `staff_profiles.totalLeave`, `staff_profiles.usedLeave`, `staff_profiles.vacationUsed`, `staff_profiles.sickUsed`
   - All pulled from database, calculated in real-time

6. **HMO Benefits** - ✅ REAL DATA (NOT TEXT FIELD)
   - Source: `staff_profiles.hmo` (Boolean field)
   - Vanessa has `hmo: true` from `job_acceptances.hmoIncluded`
   - Correctly shows "Active" when `true`

7. **Interests** - ✅ PULLING CORRECTLY
   - Source: `staff_welcome_forms` table via `/api/welcome` endpoint
   - Fetched separately from profile data

### ✅ WHAT'S FIXED

1. **Emergency Contact - FIELD NAME MISMATCH BUG** ✅ **FIXED**
   - **Issue:** Component expected `emergencyContactRelation`, `emergencyContactPhone`, `emergencyContactAddress`
   - **Database had:** `emergencyContactName`, `emergencyContactNo`, `emergencyRelationship`
   - **Fix Applied:** Updated `components/profile-view.tsx` interface to match database schema
   - **Result:** Emergency contact now displays correctly (Maria Garcia, Mother, +639171234568)

2. **Documents Tab - NO DOCUMENTS SHOWING** ✅ **FIXED**
   - **Issue:** All document URL fields were `NULL` in Vanessa's `staff_personal_records`
   - **Fix Applied:** Updated all 15 document fields with test URL
   - **Test URL:** `https://hdztsymxdgpcqtorjgou.supabase.co/storage/v1/object/public/staff/staff_avatar/37086f53-b8b2-4ed8-bec6-b373ead68d0d/avatar.jpg`
   - **Documents Added:**
     - Government: SSS, TIN, PhilHealth, Pag-IBIG ✅
     - Personal: Valid ID, Birth Certificate ✅
     - Clearance: NBI, Police ✅
     - Additional: BIR 2316, ID Photo, Signature, COE, Medical, Resume, Contract ✅
   - **Result:** All existing document cards in Documents tab now show clickable links

### ❌ WHAT'S STILL BROKEN

3. **Employment Contract - NOT IN PERSONAL RECORDS** 🚨 > How Do we Conver to PDF? With Signiture on it? > Time Stamp that it is Validted? that this person Signed it 
   - **The Issue:** Employment contract is stored in `employment_contracts` table, NOT in `staff_personal_records`
   - **Schema:** `employment_contracts` has `contractText` (string), not a Supabase URL
   - **Where it should go:** 
     - When signed: PDF should be generated and uploaded to Supabase bucket `staff/employment_contracts/`
     - URL should be saved in `staff_personal_records.employmentContractUrl`
   - **Current state:** Contract is auto-generated as TEXT, not as PDF, not uploaded anywhere
   - **Fix Required:** 
     1. Generate PDF from contract text
     2. Upload to Supabase bucket
     3. Save URL to `staff_personal_records.employmentContractUrl`

### 📋 ALL DOCUMENT FIELDS NOW IN UI ✅

All `staff_personal_records` document fields are now displayed in the Documents tab:

**Government Documents (4):**
- ✅ `sssDocUrl` - SSS Document
- ✅ `tinDocUrl` - TIN Document
- ✅ `philhealthDocUrl` - PhilHealth Document
- ✅ `pagibigDocUrl` - Pag-IBIG Document

**Personal Documents (2):**
- ✅ `validIdUrl` - Valid ID
- ✅ `birthCertUrl` - Birth Certificate

**Clearance Documents (3):**
- ✅ `nbiClearanceUrl` - NBI Clearance
- ✅ `policeClearanceUrl` - Police Clearance
- ✅ `medicalCertUrl` - Medical Certificate

**Employment Records (4):**
- ✅ `resumeUrl` - Resume/CV
- ✅ `certificateEmpUrl` - Certificate of Employment
- ✅ `employmentContractUrl` - Employment Contract
- ✅ `birForm2316Url` - BIR Form 2316

**Staff ID & Signature (2):**
- ✅ `idPhotoUrl` - ID Photo
- ✅ `signatureUrl` - Digital Signature

**Total: 15 document fields, all displayed in UI**

---

## 🛠️ FIXES COMPLETED ✅

1. ✅ **DONE: Fix Emergency Contact Field Names** - Updated `components/profile-view.tsx` to match database schema
2. ✅ **DONE: Add Test Documents for Vanessa** - Updated all 15 document fields with test URL
3. ✅ **DONE: Add Missing Document Fields to UI** - Added 7 new document cards in 3 new sections:
   - **Clearance Documents**: Added Medical Certificate
   - **Employment Records** (NEW SECTION): Resume/CV, Certificate of Employment, Employment Contract, BIR Form 2316
   - **Staff ID & Signature** (NEW SECTION): ID Photo, Digital Signature

## 🛠️ FIXES COMPLETED ✅ (LATEST)

4. ✅ **DONE: Document Viewer Modal** - Staff can now view documents ON YOUR SITE without being redirected to Supabase! ✅ **TESTED & WORKING**
   - **Files Created:**
     - `components/document-viewer-modal.tsx` - Full-screen lightbox modal with navigation
   - **Files Modified:**
     - `components/profile-view.tsx` - All 15 document links now open in modal instead of new tabs
   - **Features:**
     - Click any document → Opens in full-screen modal
     - Previous/Next buttons to flip through all 15 documents
     - Keyboard navigation (Arrow keys, ESC to close)
     - Shows document name, counter (1/15), and "Open in New Tab" button
     - Supports images (JPG, PNG) and PDFs (iframe)
     - Staff stays on your platform - no external redirects!
   - **Status:** ✅ **TESTED WITH VANESSA - WORKING PERFECTLY**

5. ✅ **DONE: Fix Profile Tab Layout** - Moved personal contact info to the correct tab ✅ **FIXED**
   - **Issue:** "Personal Information" section on Profile tab had Email & Phone in the wrong place
   - **Files Modified:**
     - `components/profile-view.tsx`
   - **Changes Made:**
     - **REMOVED:** "Personal Information" card from Profile tab entirely
     - **MOVED:** Start Date & Days Employed → now in "Employment Details" card on Profile tab (where they belong)
     - **ADDED:** Email & Phone → now at the TOP of "Personal Details" section on Personal Info tab (correct location)
   - **Result:** 
     - Profile Tab: Clean employment info only (Company, Account Manager, Start Date, Days Employed, Salary)
     - Personal Info Tab: Contact details first (Email, Phone), then personal details (DOB, Gender, etc.)

6. ✅ **DONE: Complete My Interests Section** - Added ALL 8 missing fields from Welcome Form + improved layout ✅ **COMPLETE**
   - **Issue:** My Interests section was missing 8 fields that exist in `staff_welcome_forms` table
   - **Files Modified:**
     - `components/profile-view.tsx`
   - **Changes Made:**
     - **CHANGED LAYOUT:** Grid from 2 columns → 3 columns (better use of space)
     - **ADDED 8 MISSING FIELDS:**
       1. 📚 Favorite Book
       2. 🍂 Favorite Season
       3. 🐾 Pet Name
       4. ⚽ Favorite Sport
       5. 🎮 Favorite Game
       6. 💬 Favorite Quote (spans 2 columns)
       7. ⭐ Fun Fact
       8. 📝 Additional Info (spans 3 columns - full width)
   - **Result:** Now displays ALL 14 interest fields from Welcome Form in a clean 3-column grid

## 🛠️ FIXES REMAINING

1. **MEDIUM: Contract PDF Generation** - Convert text contract to PDF and store in Supabase
2. **LOW: Verify all data flows end-to-end** - Test the complete hiring → onboarding → profile flow










