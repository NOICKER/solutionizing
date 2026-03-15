import { NextRequest, NextResponse } from 'next/server'

/**
 * DEV-ONLY endpoint to set/clear the auth bypass cookie.
 *
 * Usage:
 *   /api/dev/bypass?role=tester   → logs you in as the dev tester
 *   /api/dev/bypass?role=founder  → logs you in as the dev founder
 *   /api/dev/bypass?role=none     → clears the bypass cookie
 */
export async function GET(request: NextRequest) {
    const role = request.nextUrl.searchParams.get('role')?.toLowerCase()

    if (!role || !['tester', 'founder', 'none'].includes(role)) {
        return NextResponse.json(
            {
                error: 'Invalid role. Use ?role=tester, ?role=founder, or ?role=none',
                usage: {
                    tester: '/api/dev/bypass?role=tester',
                    founder: '/api/dev/bypass?role=founder',
                    clear: '/api/dev/bypass?role=none',
                },
            },
            { status: 400 }
        )
    }

    if (role === 'none') {
        const res = NextResponse.redirect(new URL('/', request.url))
        res.cookies.delete('DEV_AUTH_BYPASS')
        return res
    }

    const redirectTo = role === 'founder' ? '/dashboard/founder' : '/dashboard/tester'
    const res = NextResponse.redirect(new URL(redirectTo, request.url))

    res.cookies.set('DEV_AUTH_BYPASS', role, {
        path: '/',
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return res
}
