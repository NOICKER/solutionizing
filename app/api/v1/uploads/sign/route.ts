export const dynamic = 'force-dynamic'
import { basename, extname } from 'node:path'
import { requireRole } from '@/lib/api/middleware'
import { ok, badRequest, notFound, serverError } from '@/lib/api/response'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { logApiRouteError } from '@/lib/api/log'

const ALLOWED_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.mp4',
  '.mov',
])

const ALLOWED_CONTENT_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/quicktime',
])

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

    if (
      !ALLOWED_EXTENSIONS.has(extension) ||
      !ALLOWED_CONTENT_TYPES.has(contentType)
    ) {
      return badRequest('Unsupported file type')
    }

    const { nanoid } = await import('nanoid')
    const path = `${founder.founderProfile.id}/${nanoid()}/${safeFilename}`
    const { data, error } = await supabaseAdmin.storage
      .from('mission-assets')
      .createSignedUploadUrl(path)

    if (error || !data) {
      logApiRouteError(request, error)
      return serverError()
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/mission-assets/${path}`

    return ok({
      signedUrl: data.signedUrl,
      publicUrl,
    })
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}

