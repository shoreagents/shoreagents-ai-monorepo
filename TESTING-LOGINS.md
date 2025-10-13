# 🧪 Testing Login Credentials

Quick reference for testing all 3 portals

---

## 🔧 System Admin (Shore Agents Management)

**Portal:** Admin Portal  
**URL:** http://localhost:3000/admin  
**Login:** http://localhost:3000/login

```
Email:    sysadmin@shoreagents.com
Password: admin123
Role:     ADMIN
```

**What you can do:**
- ✅ Dashboard with system statistics
- ✅ Manage all staff members
- ✅ Manage all client organizations
- ✅ View/manage staff assignments
- ✅ Track and send performance reviews
- ✅ View all tickets, tasks, documents

---

## 👥 Staff Member (Offshore Staff)

**Portal:** Staff Portal  
**URL:** http://localhost:3000/  
**Login:** http://localhost:3000/login

```
Email:    staff@shoreagents.com
Password: staff123
Role:     STAFF
```

**What you can do:**
- ✅ Personal dashboard
- ✅ Track tasks and productivity
- ✅ Clock in/out time tracking
- ✅ View performance reviews
- ✅ Submit tickets
- ✅ Upload documents
- ✅ View gamification (XP, badges)

---

## 🏢 Client User (Client Organization Manager)

**Portal:** Client Portal  
**URL:** http://localhost:3000/client  
**Login:** http://localhost:3000/login

```
Email:    client@techcorp.com
Password: client123
Role:     CLIENT
```

**What you can do:**
- ✅ View assigned offshore staff
- ✅ Submit performance reviews
- ✅ Create tasks for staff
- ✅ View staff productivity
- ✅ Submit support tickets
- ✅ Manage documents

---

## 🚀 Quick Test Steps

### Test 1: System Admin
1. Logout (if logged in)
2. Go to: http://localhost:3000/login
3. Use: `sysadmin@shoreagents.com` / `admin123`
4. Should redirect to: http://localhost:3000/admin
5. Check: Dashboard, Staff, Clients, Assignments, Reviews

### Test 2: Staff Member
1. Logout
2. Go to: http://localhost:3000/login
3. Use: `staff@shoreagents.com` / `staff123`
4. Should redirect to: http://localhost:3000/
5. Check: Tasks, Time tracking, Reviews

### Test 3: Client User
1. Logout
2. Go to: http://localhost:3000/login
3. Use: `client@techcorp.com` / `client123`
4. Should redirect to: http://localhost:3000/client
5. Check: Staff list, Submit reviews, Create tasks

---

## 🔑 Create These Test Users

Run this script to create all test users:

```bash
npx tsx scripts/create-test-users.ts
```

---

## 📊 Portal Comparison

| Feature | System Admin | Staff Portal | Client Portal |
|---------|-------------|--------------|---------------|
| **Access URL** | `/admin` | `/` | `/client` |
| **Manage Staff** | ✅ All | ❌ | ❌ |
| **Manage Clients** | ✅ | ❌ | ❌ |
| **Assignments** | ✅ View All | ✅ View Own | ✅ View Own Staff |
| **Reviews** | ✅ Send/View All | ✅ View Own | ✅ Submit for Staff |
| **Time Tracking** | ✅ View All | ✅ Track Own | ✅ View Staff |
| **Tasks** | ✅ View All | ✅ Manage Own | ✅ Create for Staff |
| **Documents** | ✅ View All | ✅ Upload Own | ✅ Share with Staff |

---

**Keep this file open in a tab for quick reference!** 📌

