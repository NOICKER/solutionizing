// Supabase Edge Function: assign-pending
// Replaces the Vercel cron route. Called every 15 minutes via pg_cron.
// Uses the Supabase JS client (service-role) to query the database directly
// and the app's API for the assignment logic.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const OVERASSIGNMENT_FACTOR = 1.3

// Assignment statuses that count as "open" (mirrors OPEN_ASSIGNMENT_STATUSES)
const OPEN_ASSIGNMENT_STATUSES = ['ASSIGNED', 'IN_PROGRESS']

Deno.serve(async (req: Request) => {
  try {
    // Authenticate: accept Authorization Bearer with service-role key
    const authorization = req.headers.get('authorization')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const bearerToken = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : null

    if (bearerToken !== serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // 1. Find all ACTIVE missions
    const { data: activeMissions, error: missionsError } = await supabase
      .from('Mission')
      .select('id, testersRequired, testersCompleted')
      .eq('status', 'ACTIVE')

    if (missionsError) {
      console.error('[assign-pending] Error fetching missions:', missionsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch missions', details: missionsError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!activeMissions || activeMissions.length === 0) {
      console.log('[assign-pending] No active missions found')
      return new Response(
        JSON.stringify({ missionsChecked: 0, results: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 2. For each active mission, count open assignments and filter
    const missionsNeedingTesters: { id: string; testersRequired: number; testersCompleted: number }[] = []

    for (const mission of activeMissions) {
      const { count, error: countError } = await supabase
        .from('MissionAssignment')
        .select('id', { count: 'exact', head: true })
        .eq('missionId', mission.id)
        .in('status', OPEN_ASSIGNMENT_STATUSES)

      if (countError) {
        console.error(`[assign-pending] Error counting assignments for mission ${mission.id}:`, countError)
        continue
      }

      const openSlots = count ?? 0
      const remainingRequired = mission.testersRequired - mission.testersCompleted
      const slotsNeeded = Math.ceil(remainingRequired * OVERASSIGNMENT_FACTOR) - openSlots

      if (slotsNeeded > 0) {
        missionsNeedingTesters.push(mission)
      }
    }

    console.log(
      `[assign-pending] Found ${missionsNeedingTesters.length} active mission(s) needing testers`
    )

    if (missionsNeedingTesters.length === 0) {
      return new Response(
        JSON.stringify({ missionsChecked: 0, results: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 3. Call the existing Next.js API route to run assignTestersToMission
    //    This keeps all Prisma/business logic in the Next.js app.
    const appUrl = Deno.env.get('APP_URL')
    const cronSecret = Deno.env.get('CRON_SECRET')

    if (appUrl && cronSecret) {
      // Delegate to the existing Next.js cron route which has Prisma access
      const response = await fetch(`${appUrl}/api/v1/cron/assign-pending`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cronSecret}`,
        },
      })

      const result = await response.json()
      console.log('[assign-pending] Delegated to app route, result:', JSON.stringify(result))

      return new Response(
        JSON.stringify(result),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Fallback: if APP_URL not set, just report what we found
    console.warn('[assign-pending] APP_URL or CRON_SECRET not set — cannot delegate assignment')
    return new Response(
      JSON.stringify({
        missionsChecked: missionsNeedingTesters.length,
        missionIds: missionsNeedingTesters.map((m) => m.id),
        warning: 'APP_URL or CRON_SECRET not configured — missions identified but assignment not executed',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[assign-pending] Unhandled error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
