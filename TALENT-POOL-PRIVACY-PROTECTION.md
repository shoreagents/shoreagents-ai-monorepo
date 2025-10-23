# 🛡️ Talent Pool Privacy Protection System

**Date:** October 23, 2025  
**Status:** ✅ FULLY PROTECTED - Contact Info Hidden

---

## 🎯 **Purpose**

Clients can **browse candidates** to see their professional skills and qualifications, but **cannot access their contact information** directly. This prevents clients from bypassing the platform and contacting candidates outside the system.

---

## 🌊 **The Protection Flow**

```
Client Views /client/recruitment (Talent Pool Tab)
    ↓
Frontend calls: GET /api/client/candidates
    ↓
API fetches from BPOC Database (lib/bpoc-db.ts)
    ↓
Database returns: Only safe fields (no email, phone, last_name)
    ↓
Anonymization Layer (lib/anonymize-candidate.ts)
    ↓
Sanitizes ALL text fields for embedded contact info
    ↓
Returns SAFE data to client
    ↓
Frontend displays professional info only
```

---

## ✅ **What Clients CAN See** (Safe to Browse)

### Card View (Talent Pool Grid)
- ✅ First name only ("Maria", "John")
- ✅ Avatar photo
- ✅ Job position/title
- ✅ General location (City, Province, Country)
- ✅ Short bio (sanitized, 150 chars max)
- ✅ Top 5 skills
- ✅ Years of experience (calculated from work history)
- ✅ Cultural fit score (%)
- ✅ DISC personality type
- ✅ Typing speed (WPM)
- ✅ Leaderboard score

### Full Profile View (Detailed Page)
- ✅ All card view data
- ✅ Complete professional summary
- ✅ All skills (unlimited)
- ✅ Work experience:
  - Job titles
  - Company names (public info)
  - Employment dates
  - Job descriptions (sanitized)
- ✅ Education history:
  - Degrees
  - Institutions
  - Years
  - Majors
- ✅ Certifications
- ✅ Languages spoken
- ✅ AI Analysis results
- ✅ DISC personality assessment
- ✅ Performance metrics

---

## ❌ **What Clients CANNOT See** (Protected)

### Personal Identifiers
- ❌ Last name / Family name
- ❌ Full legal name
- ❌ Middle name

### Contact Information
- ❌ Email address
- ❌ Phone numbers (mobile, landline)
- ❌ Home address / Street address
- ❌ Postal code
- ❌ Skype / Viber / WhatsApp usernames
- ❌ Telegram / Discord handles
- ❌ LinkedIn profile links
- ❌ Personal social media

### Sensitive Data
- ❌ Date of birth / Age
- ❌ Government IDs (SSS, TIN, PhilHealth, Pag-IBIG)
- ❌ Application history
- ❌ Interview records with other clients
- ❌ Salary expectations (candidate side)
- ❌ Current employment status details

---

## 🔒 **Protection Mechanisms**

### Layer 1: Database Query Filtering
**File:** `lib/bpoc-db.ts`

The database query **only fetches safe fields**:
```sql
SELECT 
  u.id,
  u.first_name,        -- ✅ Only first name
  u.avatar_url,
  u.bio,
  u.position,
  u.location_city,     -- ✅ General location only
  u.location_country,
  re.resume_data,      -- ✅ Passed to sanitization layer
  -- Assessment data...
FROM users u
-- NO u.last_name
-- NO u.email
-- NO u.phone
```

### Layer 2: Anonymization Functions
**File:** `lib/anonymize-candidate.ts`

Two functions control what gets exposed:

#### `anonymizeCandidateForList()` - For browsing cards
- Only extracts specific safe fields
- Truncates bio to 150 characters
- Limits skills to top 5
- **NEW:** Sanitizes bio text for embedded contact info

#### `anonymizeCandidateForProfile()` - For detailed view
- Extracts comprehensive professional data
- Sanitizes all text fields (bio, summary, descriptions)
- **NEW:** Strips embedded emails/phones from:
  - Bio
  - Resume summary
  - Work experience descriptions
  - Education descriptions

### Layer 3: Contact Info Sanitization (NEW! ✨)
**Function:** `sanitizeContactInfo()`

Uses regex patterns to detect and remove:
```typescript
// Email patterns
john@example.com → [email hidden]

// Phone patterns  
+63 912 345 6789 → [phone hidden]
09123456789 → [phone hidden]
(123) 456-7890 → [phone hidden]

// Explicit contact labels
"Contact: john@example.com" → [contact info hidden]
"Phone: 09123456789" → [contact info hidden]
"Email: test@test.com" → [contact info hidden]

// Messaging apps
"Skype: john.doe123" → [messaging hidden]
"Viber: +639123456789" → [messaging hidden]
"WhatsApp: 09123456789" → [messaging hidden]
```

---

## 🎯 **How Clients Request Contact**

Since clients **cannot see contact details**, they must use the platform:

### 1. Browse Talent Pool
Client sees professional profiles without contact info

### 2. Request Interview
Click **"Request Interview"** button on candidate profile

### 3. Admin Coordinates
- Admin receives interview request
- Admin contacts candidate on BPOC side
- Admin schedules interview
- Admin creates Daily.co video meeting

### 4. Interview Happens
Both parties meet via platform video call

### 5. Decision Made
Client decides to hire → Admin facilitates the process

**Only after hire acceptance** does the candidate become a staff member, and contact info becomes available through the staff management system.

---

## 🧪 **Testing the Protection**

### Test Case 1: Card View
```bash
# Visit talent pool
http://localhost:3000/client/recruitment → Talent Pool Tab

# Verify you see:
✅ First names only
✅ Skills, experience, scores
❌ NO last names
❌ NO email addresses
❌ NO phone numbers
```

### Test Case 2: Full Profile
```bash
# Click any candidate card
http://localhost:3000/client/talent-pool/[id]

# Verify all 4 tabs:
✅ Profile tab shows work history (sanitized)
✅ AI Analysis shows strengths
✅ DISC shows personality assessment
✅ Performance shows typing/metrics
❌ NO contact information anywhere
```

### Test Case 3: Contact Info Sanitization
If a candidate's resume contained:
```
"Experienced developer. Contact me at john@example.com or 09123456789"
```

Client will see:
```
"Experienced developer. Contact me at [email hidden] or [phone hidden]"
```

---

## 📋 **Files Modified/Created**

### Enhanced Files (Oct 23, 2025)
```
✅ lib/anonymize-candidate.ts
   - Added sanitizeContactInfo() function
   - Enhanced anonymizeCandidateForList()
   - Enhanced anonymizeCandidateForProfile()
   - Enhanced anonymizeExperience()
   - Enhanced anonymizeEducation()
```

### Existing Protection Files
```
✅ lib/bpoc-db.ts (database queries)
✅ app/api/client/candidates/route.ts (list endpoint)
✅ app/api/client/candidates/[id]/route.ts (detail endpoint)
✅ app/client/recruitment/page.tsx (frontend)
✅ app/client/talent-pool/[id]/page.tsx (profile page)
```

---

## 🚀 **Summary**

### Protection Level: **MAXIMUM** 🛡️

- **3 Layers of Protection**
- **Regex-based contact sanitization**
- **Zero contact info exposure**
- **Browse-only access for clients**
- **Platform-controlled communication**

Clients can browse all professional qualifications but **must go through the platform** to make contact. This ensures:
- ✅ All interactions are tracked
- ✅ Candidates are protected from spam
- ✅ Platform revenue is preserved
- ✅ Professional hiring process maintained

---

_The best protection is invisible protection._ 👻✨


