# Supabase Storage Setup Guide 🗄️

## ⚠️ **IMPORTANT: One-Time Setup Required**

Before image uploads will work, you need to create a Storage Bucket in your Supabase dashboard.

---

## 🚀 **Step-by-Step Setup**

### **Step 1: Go to Supabase Dashboard**
1. Open your browser and go to: https://supabase.com/dashboard
2. Select your project
3. Click on **"Storage"** in the left sidebar

### **Step 2: Create a New Bucket**
1. Click the **"New bucket"** button
2. Fill in the following details:
   - **Name:** `profile-images`
   - **Public bucket:** ✅ **Check this box** (important!)
   - **File size limit:** Leave default or set to 10MB
   - **Allowed MIME types:** Leave empty (or set to `image/*` if you want)

3. Click **"Create bucket"**

### **Step 3: Configure Bucket Policies (Optional but Recommended)**
For better security, you can set up RLS policies:

1. In the Storage page, click on the **"profile-images"** bucket
2. Click on **"Policies"** tab
3. Add the following policies:

#### **Policy 1: Allow Authenticated Users to Upload**
```sql
-- Policy name: Allow authenticated uploads
-- Operation: INSERT
-- Target roles: authenticated

CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images' AND 
  (storage.foldername(name))[1] IN ('avatars', 'covers')
);
```

#### **Policy 2: Public Read Access**
```sql
-- Policy name: Public read access
-- Operation: SELECT
-- Target roles: public

CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-images');
```

#### **Policy 3: Users Can Update Their Own Images**
```sql
-- Policy name: Users can update own images
-- Operation: UPDATE
-- Target roles: authenticated

CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images')
WITH CHECK (bucket_id = 'profile-images');
```

---

## 📂 **Bucket Structure**

Your bucket will automatically organize files like this:
```
profile-images/
├── avatars/
│   ├── avatar-user123-1234567890.jpg
│   ├── avatar-user123-1234567891.png
│   └── ...
└── covers/
    ├── cover-user123-1234567890.jpg
    ├── cover-user123-1234567891.png
    └── ...
```

---

## ✅ **Verify Setup**

After creating the bucket, you can test it:

1. **Restart your dev server** (if running)
2. Go to `/profile` page
3. Try uploading an avatar or cover photo
4. Check your Supabase Storage dashboard - you should see the files!

---

## 🔍 **Troubleshooting**

### **Error: "Bucket not found"**
- Make sure the bucket name is exactly `profile-images` (lowercase, with hyphen)
- Refresh your Supabase dashboard
- Check that the bucket was created successfully

### **Error: "Upload failed: new row violates row-level security policy"**
- Make sure the bucket is set to **Public**
- Or add the RLS policies mentioned above
- Verify your `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`

### **Error: "Access denied"**
- Check that your Supabase credentials in `.env.local` are correct:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (important for uploads!)

### **Images Upload but Don't Display**
- Make sure the bucket is set to **Public**
- Check the browser console for CORS errors
- Verify the URL format in the database matches Supabase's public URL format

---

## 🔐 **Security Notes**

1. **Service Role Key**
   - The upload endpoints use `supabaseAdmin` (service role key)
   - This bypasses RLS policies for uploads
   - Never expose this key on the client side!

2. **File Naming**
   - Files are named with user ID and timestamp
   - Prevents filename collisions
   - Makes it easy to track who uploaded what

3. **File Validation**
   - Type checking (images only)
   - Size limits (5MB avatar, 10MB cover)
   - Done before uploading to Supabase

---

## 📊 **What Gets Stored Where**

| Data | Location | Example |
|------|----------|---------|
| Image Files | Supabase Storage | `profile-images/avatars/avatar-123.jpg` |
| Image URLs | Supabase PostgreSQL (via Prisma) | `https://xxx.supabase.co/storage/v1/object/public/profile-images/avatars/avatar-123.jpg` |
| User Data | Supabase PostgreSQL (via Prisma) | `User.avatar`, `User.coverPhoto` fields |

---

## 🎯 **Benefits of Supabase Storage**

✅ **Global CDN** - Fast image delivery worldwide
✅ **Scalable** - Handles any number of uploads
✅ **Reliable** - No local filesystem dependencies
✅ **Production Ready** - Works across multiple servers
✅ **Built-in Features** - Image transformations, resizing (can be added)
✅ **Easy Management** - Visual dashboard for all files

---

## 🔄 **Next Steps After Setup**

1. ✅ Create the `profile-images` bucket
2. ✅ Set it to Public
3. ✅ (Optional) Add RLS policies
4. ✅ Restart your dev server
5. ✅ Test by uploading an avatar
6. ✅ Test by uploading a cover photo
7. ✅ Check Supabase dashboard to see your files

---

## 📝 **Environment Variables Required**

Make sure these are in your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

The `SUPABASE_SERVICE_ROLE_KEY` is especially important for uploads!

---

## ✨ **All Done!**

Once you complete the setup above, your image upload feature will be **fully functional** and production-ready! 🎉

Files will be stored in Supabase Storage, and URLs will be saved to your database automatically.


