import { ok, serverError, badRequest } from '@/lib/api/response'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { logApiRouteError } from '@/lib/api/log'
import { nanoid } from 'nanoid'

export const dynamic = 'force-dynamic'

const FEEDBACK_BUCKET = 'feedback-screenshots'

async function ensureBucket() {
  const existingBucket = await supabaseAdmin.storage.getBucket(FEEDBACK_BUCKET)
  
  if (existingBucket.data) {
    if (existingBucket.data.public) return true
    const updatedBucket = await supabaseAdmin.storage.updateBucket(FEEDBACK_BUCKET, {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
      fileSizeLimit: '5242880', // 5MB
    })
    return !updatedBucket.error
  }
  
  const createdBucket = await supabaseAdmin.storage.createBucket(FEEDBACK_BUCKET, {
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    fileSizeLimit: '5242880',
  })
  
  return !createdBucket.error || /already exists/i.test(createdBucket.error.message)
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return badRequest('No file provided')
    }

    const bucketReady = await ensureBucket()
    if (!bucketReady) {
      return serverError()
    }

    const ext = file.name.split('.').pop() || 'png'
    const path = `${nanoid()}.${ext}`

    const { data, error } = await supabaseAdmin.storage
      .from(FEEDBACK_BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: false
      })

    if (error || !data) {
      logApiRouteError(request, error)
      return serverError()
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${FEEDBACK_BUCKET}/${path}`

    return ok({ url: publicUrl })
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
