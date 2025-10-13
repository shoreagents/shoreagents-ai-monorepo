# 🧪 Testing Login Credentials

Quick reference for testing all 3 portals

---

## 🔧 System Admin (Shore Agents Management)

**Portal:** Admin Portal  
**URL:** http://localhost:3000/admin  
**Login:** http://localhost:3000/login/admin

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

## 👥 Maria Santos (Offshore Staff - REAL DATA 🔥)

**Portal:** Staff Portal  
**URL:** http://localhost:3000/  
**Login:** http://localhost:3000/login/staff

```
Email:    maria.santos@techcorp.com
Password: password123
Role:     STAFF
Status:   ✅ HAS FULL PROFILE + ALL DATA
```

**What Maria has:**
- ✅ Full profile with avatar & cover photo
- ✅ Real gamification data (points, level, badges)
- ✅ Tasks, time entries, reviews
- ✅ Complete staff setup
- ✅ Assigned to TechCorp client

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
**Login:** http://localhost:3000/login/client

```
Email:    client@techcorp.com
Password: client123
Role:     CLIENT
```

**What you can do:**
- ✅ View assigned offshore staff (Maria Santos)
- ✅ Submit performance reviews
- ✅ Create tasks for staff
- ✅ View staff productivity
- ✅ Submit support tickets
- ✅ Manage documents

---

## 🚀 Quick Test Steps

### Test 1: System Admin
1. Logout (if logged in)
2. Go to: http://localhost:3000/login/admin
3. Use: `sysadmin@shoreagents.com` / `admin123`
4. Should redirect to: http://localhost:3000/admin
5. Check: Dashboard, Staff, Clients, Assignments, Reviews

### Test 2: Maria Santos (Staff Member)
1. Logout
2. Go to: http://localhost:3000/login/staff
3. Use: `maria.santos@techcorp.com` / `password123`
4. Should redirect to: http://localhost:3000/
5. Check: Tasks, Time tracking, Reviews, Profile with real data

### Test 3: Client User
1. Logout
2. Go to: http://localhost:3000/login/client
3. Use: `client@techcorp.com` / `client123`
4. Should redirect to: http://localhost:3000/client
5. Check: Staff list (should see Maria), Submit reviews, Create tasks

---

## 📊 Portal Comparison

| Feature | System Admin | Maria Santos (Staff) | Client Portal |
|---------|-------------|---------------------|---------------|
| **Access URL** | `/admin` | `/` | `/client` |
| **Manage Staff** | ✅ All | ❌ | ❌ |
| **Manage Clients** | ✅ | ❌ | ❌ |
| **Assignments** | ✅ View All | ✅ View Own | ✅ View Own Staff |
| **Reviews** | ✅ Send/View All | ✅ View Own | ✅ Submit for Staff |
| **Time Tracking** | ✅ View All | ✅ Track Own | ✅ View Staff |
| **Tasks** | ✅ View All | ✅ Manage Own | ✅ Create for Staff |
| **Documents** | ✅ View All | ✅ Upload Own | ✅ Share with Staff |

---

## 🔥 MARIA IS THE MAIN TEST USER

**Use Maria Santos for all Staff portal testing!**

She has:
- ID: `c463d406-e524-4ef6-8ab5-29db543d4cb6`
- Avatar: ✅ Uploaded
- Cover Photo: ✅ Uploaded
- Profile: ✅ Complete
- Gamification: ✅ Active
- Assignments: ✅ Assigned to TechCorp

---

**Keep this file open in a tab for quick reference!** 📌

