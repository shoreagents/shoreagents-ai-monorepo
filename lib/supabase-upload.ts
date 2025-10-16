import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function uploadCompanyFile(
  file: File,
  companyId: string,
  type: 'logo' | 'cover' | 'asset'
): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${companyId}-${Date.now()}.${fileExt}`
  const folder = type === 'logo' ? 'company_logo' : type === 'cover' ? 'company_cover' : 'company_asset'
  const filePath = `${folder}/${fileName}`

  const { data, error } = await supabase.storage
    .from('company')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('company')
    .getPublicUrl(filePath)

  return publicUrl
}

export async function deleteCompanyFile(fileUrl: string): Promise<void> {
  // Extract path from URL
  const urlParts = fileUrl.split('/storage/v1/object/public/company/')
  if (urlParts.length < 2) return

  const filePath = urlParts[1]

  const { error} = await supabase.storage
    .from('company')
    .remove([filePath])

  if (error) {
    console.error('Failed to delete file:', error)
  }
}

export async function uploadClientFile(
  file: File,
  clientUserId: string,
  type: 'avatar' | 'cover'
): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${clientUserId}-${Date.now()}.${fileExt}`
  const folder = type === 'avatar' ? 'client_avatars' : 'client_covers'
  const filePath = `${folder}/${fileName}`

  const { data, error } = await supabase.storage
    .from('client')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('client')
    .getPublicUrl(filePath)

  return publicUrl
}

export async function deleteClientFile(fileUrl: string): Promise<void> {
  // Extract path from URL
  const urlParts = fileUrl.split('/storage/v1/object/public/client/')
  if (urlParts.length < 2) return

  const filePath = urlParts[1]

  const { error } = await supabase.storage
    .from('client')
    .remove([filePath])

  if (error) {
    console.error('Failed to delete file:', error)
  }
}

