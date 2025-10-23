# 🐛 Known Issues - October 23, 2025

## ❌ Issue 1: Recruitment Interview Requests (500 Error)

### **Error:**
```
POST /api/client/interviews/request 500
relation "interview_requests" does not exist
```

### **Location:**
- `/api/client/interviews/request`
- Recruitment page when requesting interviews

### **Root Cause:**
- Database is not managed by Prisma Migrate
- `interview_requests` table missing in database
- Schema defines it, but table was never created

### **Impact:**
- ⚠️ **LOW:** Does NOT affect GUNTING onboarding system
- Only affects client recruitment/interview requests
- All other recruitment features work (viewing candidates, talent pool)

### **Fix Options:**

**Option 1: Initialize Prisma Migrations (Baseline)**
```bash
# Create initial migration from current database
npx prisma migrate dev --name init --create-only

# Review the migration file, then apply
npx prisma migrate deploy
```

**Option 2: Create Missing Table Only**
```sql
-- Run in database directly
CREATE TABLE interview_requests (
  -- ... schema fields ...
);
```

**Option 3: Ignore for Now**
- Not critical for GUNTING testing
- Can fix after GUNTING is complete

---

## ✅ Issue 2: ElectronProvider Warnings (Non-Critical)

### **Warning:**
```
A listener indicated an asynchronous response by returning true,
but the message channel closed before a response was received
```

### **Root Cause:**
- Browser extension conflict (likely Chrome DevTools or another extension)
- ElectronProvider checking for Electron environment
- Not an actual error in our code

### **Impact:**
- ⚠️ **NONE:** Just console noise
- Doesn't affect functionality
- Can be ignored

### **Fix:**
- Can be suppressed in production build
- Not worth fixing in dev environment

---

## 📊 Status:

**Critical Bugs:** 0  
**Non-Critical Issues:** 2  
**GUNTING Blockers:** 0  

---

## 🎯 GUNTING Testing:

**These URLs work fine:**
- ✅ http://localhost:3000/staff/onboarding
- ✅ http://localhost:3000/admin/staff/onboarding  
- ✅ http://localhost:3000/staff/contract

**Avoid for now:**
- ❌ Interview request button on recruitment page

---

**Last Updated:** October 23, 2025  
**Severity:** LOW - No GUNTING blockers ✅

