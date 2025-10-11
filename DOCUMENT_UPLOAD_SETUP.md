# Document Upload Setup Instructions

## ✅ Completed

The document upload system has been successfully implemented! Here's what was done:

- ✅ Updated Database Schema (added userId relation to Document model)
- ✅ Installed @supabase/supabase-js package
- ✅ Created Supabase client utility (`lib/supabase.ts`)
- ✅ Created API endpoints (`/api/documents`)
- ✅ Created Document Upload component
- ✅ Updated AI Chat Assistant with real data
- ✅ Ran database migration

## 🔧 Required Setup Steps

### Step 1: Add Supabase Credentials to .env

Add these environment variables to your `.env` file:

```env
# Supabase Storage (for file uploads)
NEXT_PUBLIC_SUPABASE_URL="https://hdztsymxdgpcqtorjgou.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
```

**To get your Supabase keys:**

1. Go to: https://supabase.com/dashboard
2. Select your project: `hdztsymxdgpcqtorjgou`
3. Click: **Settings** → **API**
4. Copy the **Project URL** → paste into `NEXT_PUBLIC_SUPABASE_URL`
5. Copy the **anon public** key → paste into `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 2: Create Supabase Storage Bucket

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click: **Storage** in the left sidebar
4. Click: **Create a new bucket**
5. Bucket name: `training-documents`
6. Set to: **Private** (recommended for user-specific files)
7. Click: **Create bucket**

### Step 3: Set Up Storage Policies (Optional but Recommended)

For better security, create Row Level Security (RLS) policies:

1. In Supabase Dashboard → **Storage** → `training-documents` bucket
2. Click **Policies**
3. Add these policies:

**Policy 1: Users can upload their own files**
```sql
CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'training-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
```

**Policy 2: Users can view their own files**
```sql
CREATE POLICY "Users can view their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'training-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
```

**Policy 3: Users can delete their own files**
```sql
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'training-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### Step 4: Restart Development Server

After adding the environment variables:

```bash
# Kill current dev server (Ctrl+C in terminal)
pnpm dev

# In another terminal, restart Electron
pnpm electron
```

## 🎉 How to Use

### For Maria (or any staff user):

1. **Login** as Maria (maria.santos@techcorp.com / password123)
2. **Go to AI Assistant** page
3. **Click "Upload Document"** button in the sidebar
4. **Select a file** (PDF, TXT, MD, DOC, or DOCX - max 10MB)
5. **Choose a category** (Client Docs, Training, Procedures, Culture, SEO)
6. **Click Upload**
7. **View your documents** in the sidebar
8. **Download** or **Delete** documents using the buttons that appear on hover

### Supported File Types:
- PDF (`.pdf`)
- Text (`.txt`)
- Markdown (`.md`)
- Word Documents (`.doc`, `.docx`)

### File Size Limit:
- Maximum: 10MB per file

## 📁 What Was Implemented

### Database Changes:
- Added `userId` field to `Document` model
- Added user relation with CASCADE delete
- Added `documents` relation to `User` model

### API Endpoints:
- `GET /api/documents` - Fetch user's documents
- `POST /api/documents` - Upload new document
- `DELETE /api/documents/[id]` - Delete document

### Frontend Changes:
- Removed all mock data from AI Chat Assistant
- Added real document fetching from API
- Added document upload modal with progress indicator
- Added delete functionality with confirmation
- Added download links for documents
- Updated document stats to show real counts
- Added loading states and empty states

### Security:
- Documents are linked to specific users (userId)
- Users can only see/delete their own documents
- File type validation (only allowed types)
- File size validation (max 10MB)
- Ownership verification on delete

## 🔮 Future Enhancements (Phase 2)

These features are planned for later:

- ✨ Claude AI integration for intelligent responses
- 📄 Text extraction from PDFs/DOCX for AI analysis
- 👥 Management can upload documents visible to all staff
- 🏢 Clients can upload documents visible to their team
- 🔍 Vector embeddings for better document search (RAG)
- 📊 Document analytics and usage tracking

## 🐛 Troubleshooting

### Issue: 401 Unauthorized when fetching documents
**Solution:** Make sure you're logged in and the session is valid.

### Issue: 500 Error when uploading
**Solution:** 
1. Check that Supabase credentials are in `.env`
2. Verify the `training-documents` bucket exists
3. Check browser console for detailed error

### Issue: Documents not showing up
**Solution:**
1. Refresh the page
2. Check browser console for API errors
3. Verify database migration ran successfully

### Issue: Can't delete documents
**Solution:**
1. Make sure you own the document
2. Check that the document exists in Supabase Storage
3. Check browser console for errors

## 📞 Need Help?

If you encounter any issues, check:
1. Browser console for JavaScript errors
2. Terminal logs for API errors
3. Supabase Dashboard → Logs for storage errors

---

**Status:** ✅ Ready to use once environment variables are added and storage bucket is created!

