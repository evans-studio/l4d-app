import { NextRequest } from 'next/server'
import { authenticateAdmin } from '@/lib/api/auth-handler'
import { ApiResponseHandler } from '@/lib/api/response'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.error!
    }

    // Optional: accept JSON body with paths/tags
    let body: { paths?: string[]; tags?: string[] } | undefined
    try {
      body = await request.json()
    } catch {
      body = undefined
    }

    const paths = body?.paths || ['/','/admin','/dashboard']
    const tags = body?.tags || []

    for (const p of paths) revalidatePath(p)
    for (const t of tags) revalidateTag(t)

    return ApiResponseHandler.success({ revalidated: { paths, tags } }, 'Cache cleared')
  } catch (error) {
    console.error('Clear cache error:', error)
    return ApiResponseHandler.serverError('Failed to clear cache')
  }
}


