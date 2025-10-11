# 🎨 Profile Enhancements Setup Guide

## 📋 Overview
Enhanced staff profile with cover photos, better avatars, and upload functionality - making profiles fun and personalized!

---

## 🗄️ Database Setup

### 1. Push Prisma Schema
The `coverPhoto` field has been added to the User model. Push it to your database:

```bash
npx prisma db push
```

This will add the `coverPhoto` column to your `users` table.

---

## ☁️ Supabase Storage Setup

### 2. Create Storage Buckets

Create two **PUBLIC** buckets in Supabase Dashboard:

#### Bucket 1: `staff-avatars`
1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `staff-avatars`
4. **Public bucket:** ✅ YES
5. **File size limit:** 5 MB
6. **Allowed MIME types:** `image/*`
7. Click "Create bucket"

#### Bucket 2: `staff-covers`
1. Click "New bucket"  
2. Name: `staff-covers`
3. **Public bucket:** ✅ YES
4. **File size limit:** 10 MB
5. **Allowed MIME types:** `image/*`
6. Click "Create bucket"

---

## ✨ What's New

### Cover Photo Banner
- **Full-width cover** at top of profile (like Facebook/LinkedIn)
- Default gradient if no photo uploaded
- **"Change Cover" button** in top-right corner
- Supports JPG, PNG, WEBP (up to 10MB)

### Enhanced Avatar
- **Larger avatar** (140px × 140px)
- **Overlaps the cover photo** for modern social look
- Camera button on avatar for easy uploads
- Supports JPG, PNG, WEBP, GIF (up to 5MB)

### Better UI
- **Bigger name** and role display (4xl font)
- **Status badges** with gradients
- **Hover effects** on schedule cards
- **Smoother animations**
- More colorful and fun overall!

---

## 📁 File Structure

### New Files
```
app/api/profile/avatar/route.ts   - Avatar upload endpoint
app/api/profile/cover/route.ts    - Cover photo upload endpoint
```

### Modified Files
```
prisma/schema.prisma              - Added coverPhoto field
app/api/profile/route.ts          - Returns avatar & coverPhoto
components/profile-view.tsx       - Complete UI redesign
```

---

## 🔌 API Endpoints

### POST `/api/profile/avatar`
Upload or update profile avatar.

**Request:** `multipart/form-data`
```typescript
FormData {
  avatar: File (JPG, PNG, WEBP, GIF - max 5MB)
}
```

**Response:**
```json
{
  "success": true,
  "avatarUrl": "https://...supabase.../staff-avatars/{userId}/avatar.jpg"
}
```

**Errors:**
- 400: No file / Invalid type / File too large
- 401: Unauthorized
- 500: Upload failed

---

### POST `/api/profile/cover`
Upload or update cover photo.

**Request:** `multipart/form-data`
```typescript
FormData {
  cover: File (JPG, PNG, WEBP - max 10MB)
}
```

**Response:**
```json
{
  "success": true,
  "coverUrl": "https://...supabase.../staff-covers/{userId}/cover.jpg"
}
```

**Errors:**
- 400: No file / Invalid type / File too large
- 401: Unauthorized
- 500: Upload failed

---

### GET `/api/profile`
Now includes `avatar` and `coverPhoto` in response:

```json
{
  "user": {
    "id": "uuid",
    "email": "maria@example.com",
    "name": "Maria Santos",
    "role": "STAFF",
    "avatar": "https://...supabase.../staff-avatars/{userId}/avatar.jpg",
    "coverPhoto": "https://...supabase.../staff-covers/{userId}/cover.jpg"
  },
  "profile": { ... },
  "workSchedules": [ ... ]
}
```

---

## 🎨 UI Features

### Cover Photo Section
- **264px height** - plenty of room for landscape photos
- **Gradient default** - indigo → purple → pink
- **Upload button** - top-right with camera icon
- **Loading state** - shows spinner during upload
- **Full-width image** - covers entire width

### Avatar Section
- **-mt-20** - negative margin overlaps cover
- **140×140px** - large and prominent
- **Ring decoration** - 4px ring in slate-900
- **Camera button** - bottom-right corner
- **Circular badge** - for upload button

### Profile Info
- **4xl name** - big and bold
- **Indigo role** - colored text for position
- **Client display** - with building icon
- **Status badges** - emerald for employment, indigo for days

### Cards
- **Hover scale** - slight zoom on hover
- **Gradient backgrounds** - more colorful
- **Better spacing** - more breathing room
- **Smoother transitions** - all 0.3s ease

---

## 🧪 Usage

### For Staff
1. Go to Profile page
2. Click **"Change Cover"** to upload cover photo
3. Click **camera icon on avatar** to change profile picture
4. Photos upload instantly and refresh automatically

### File Guidelines
**Avatar:**
- Square images work best (1:1 ratio)
- Recommended: 400×400px or larger
- Max size: 5MB
- Formats: JPG, PNG, WEBP, GIF

**Cover:**
- Wide images work best (16:9 ratio)
- Recommended: 1920×1080px or 1200×675px
- Max size: 10MB
- Formats: JPG, PNG, WEBP

---

## 📊 Storage Organization

### staff-avatars bucket
```
staff-avatars/
├── {userId1}/
│   └── avatar.jpg
├── {userId2}/
│   └── avatar.png
└── {userId3}/
    └── avatar.webp
```

### staff-covers bucket
```
staff-covers/
├── {userId1}/
│   └── cover.jpg
├── {userId2}/
│   └── cover.png
└── {userId3}/
    └── cover.webp
```

**Note:** Files are automatically overwritten (`upsert: true`) when user uploads a new photo.

---

## 🔐 Security

### Authentication
- NextAuth session required for all uploads
- Users can only upload their own photos
- User ID automatically extracted from session

### File Validation
**Avatar:**
- Type: image/jpeg, image/jpg, image/png, image/webp, image/gif
- Size: Max 5MB

**Cover:**
- Type: image/jpeg, image/jpg, image/png, image/webp
- Size: Max 10MB

### Storage
- Supabase Service Role Key used for uploads (bypasses RLS)
- Public buckets for easy image serving
- Organized by user ID (no cross-user access in code)

---

## 🚀 Testing Checklist

- [ ] Prisma schema pushed to database
- [ ] `staff-avatars` bucket created and public
- [ ] `staff-covers` bucket created and public
- [ ] Profile page loads with new design
- [ ] Can upload avatar (shows camera icon)
- [ ] Can upload cover (shows "Change Cover" button)
- [ ] Upload shows loading spinner
- [ ] Page refreshes after successful upload
- [ ] Images display correctly
- [ ] Error messages show for invalid files
- [ ] Hover effects work on cards
- [ ] Mobile responsive

---

## 🔮 Future Enhancements

### Phase 2
- **Image cropping tool** - crop before upload
- **Zoom & position** - adjust cover photo positioning
- **Filters** - Instagram-style filters
- **Multiple avatars** - gallery of past avatars

### Phase 3
- **Profile themes** - custom color schemes
- **Badges & awards** - display achievements on profile
- **Bio section** - staff can write about themselves
- **Social links** - LinkedIn, portfolio, etc.
- **Profile views counter** - who viewed your profile

---

## 🎨 Design Philosophy

**Social Media Style:**
- Inspired by Facebook, LinkedIn, Twitter
- Cover + avatar overlap = modern & friendly
- Big text = easy to read
- Colorful badges = more personality

**BPO Focus:**
- Still professional but more fun
- Makes staff feel valued and individual
- Encourages engagement and pride
- Easy to show off achievements

---

## 📚 Related Files

- `prisma/schema.prisma` - User model with avatar & coverPhoto
- `app/api/profile/avatar/route.ts` - Avatar upload
- `app/api/profile/cover/route.ts` - Cover upload
- `app/api/profile/route.ts` - Profile data with images
- `components/profile-view.tsx` - Complete UI
- `lib/supabase.ts` - Supabase client

---

**Last Updated:** October 11, 2025  
**Status:** Ready for Testing  
**Next:** Create buckets and test uploads! 🚀

