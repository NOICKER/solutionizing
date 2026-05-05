export const dynamic = 'force-dynamic'
import { basename, extname } from 'node:path'
import { requireRole } from '@/lib/api/middleware'
import { ok, badRequest, notFound, serverError } from '@/lib/api/response'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { logApiRouteError } from '@/lib/api/log'

const MISSION_ASSETS_BUCKET = 'mission-assets'

const ALLOWED_VIDEO_EXTENSIONS = new Set([
  '.mp4',
  '.mov',
  '.webm',
])

const ALLOWED_VIDEO_CONTENT_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
])

function isAllowedUploadType(extension: string, contentType: string) {
  if (contentType.startsWith('image/')) {
    return true
  }

  return (
    ALLOWED_VIDEO_CONTENT_TYPES.has(contentType) &&
    ALLOWED_VIDEO_EXTENSIONS.has(extension)
  )
}

async function ensureMissionAssetsBucket(request: Request) {
  const existingBucket = await supabaseAdmin.storage.getBucket(MISSION_ASSETS_BUCKET)

  if (existingBucket.data) {
    if (existingBucket.data.public) {
      return true
    }

    const updatedBucket = await supabaseAdmin.storage.updateBucket(MISSION_ASSETS_BUCKET, {
      public: true,
      allowedMimeTypes: ['image/*', 'video/mp4', 'video/quicktime', 'video/webm'],
      fileSizeLimit: '52428800',
    })

    if (!updatedBucket.error) {
      return true
    }

    logApiRouteError(request, updatedBucket.error)
    return false
  }

  const bucketMissing =
    existingBucket.error &&
    /bucket not found|related resource does not exist/i.test(existingBucket.error.message)

  if (!bucketMissing) {
    logApiRouteError(request, existingBucket.error)
    return false
  }

  const createdBucket = await supabaseAdmin.storage.createBucket(MISSION_ASSETS_BUCKET, {
    public: true,
    allowedMimeTypes: ['image/*', 'video/mp4', 'video/quicktime', 'video/webm'],
    fileSizeLimit: '52428800',
  })

  if (!createdBucket.error) {
    return true
  }

  const alreadyExists = /already exists/i.test(createdBucket.error.message)
  if (alreadyExists) {
    return true
  }

  logApiRouteError(request, createdBucket.error)
  return false
}

export async function GET(request: Request) {
  try {
    const founder = await requireRole('FOUNDER')

    if (!founder.founderProfile) {
      return notFound('Founder profile')
    }

    const requestUrl = new URL(request.url)
    const filename = requestUrl.searchParams.get('filename')
    const contentType = requestUrl.searchParams.get('contentType')

    if (!filename || !contentType) {
      return badRequest('filename and contentType are required')
    }

    const safeFilename = basename(filename)
    const extension = extname(safeFilename).toLowerCase()

    if (!isAllowedUploadType(extension, contentType)) {
      return badRequest('Unsupported file type')
    }

    const bucketReady = await ensureMissionAssetsBucket(request)
    if (!bucketReady) {
      return serverError()
    }

    const { nanoid } = await import('nanoid')
    const path = `${founder.founderProfile.id}/${nanoid()}/${safeFilename}`
    const { data, error } = await supabaseAdmin.storage
      .from(MISSION_ASSETS_BUCKET)
      .createSignedUploadUrl(path)

    if (error || !data) {
      logApiRouteError(request, error)
      return serverError()
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${MISSION_ASSETS_BUCKET}/${path}`

    return ok({
      signedUrl: data.signedUrl,
      path: data.path,
      token: data.token,
      publicUrl,
    })
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}

