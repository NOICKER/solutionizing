"use client"

import { useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { useAuth, UserRole } from '@/context/AuthContext'
import { SpinnerIcon } from '@/components/solutionizing/ui'

export function DevToolbar() {
  const { user } = useAuth()
  const [isSwitching, setIsSwitching] = useState(false)

  // Double-check environment in case this accidentally runs outside dev
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const handleRoleSwitch = async (role: UserRole) => {
    setIsSwitching(true)
    try {
      await apiFetch('/api/v1/auth/select-role', {
        method: 'POST',
        body: {
          role,
          displayName: 'Dev User',
        },
      })
      window.location.reload()
    } catch (error) {
      console.error('Failed to switch role', error)
      setIsSwitching(false)
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-[9999] group cursor-none">
      {/* Collapsed dot */}
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/80 shadow-lg backdrop-blur-md border border-amber-400/40 transition-all duration-200 group-hover:opacity-0 group-hover:scale-75">
        <div className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
      </div>

      {/* Expanded toolbar */}
      <div className="absolute bottom-0 left-0 flex flex-col gap-2 rounded-lg bg-black/90 p-3 text-xs text-white shadow-xl backdrop-blur-md border border-white/20 font-mono opacity-0 scale-90 origin-bottom-left pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto">
        <div className="flex items-center justify-between border-b border-white/20 pb-2 mb-1 gap-4 whitespace-nowrap">
          <span className="font-bold text-amber-400">DEV MODE</span>
          <span className="text-white/60">Role: <strong className="text-white ml-1">{user?.role || 'NONE'}</strong></span>
        </div>
        <div className="flex gap-2">
          <button 
            className="rounded bg-white/10 px-3 py-1.5 hover:bg-white/20 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[70px] cursor-none"
            onClick={() => handleRoleSwitch('ADMIN')}
            disabled={isSwitching || user?.role === 'ADMIN'}
          >
            {isSwitching ? <SpinnerIcon className="w-3 h-3" /> : 'Admin'}
          </button>
          <button 
            className="rounded bg-white/10 px-3 py-1.5 hover:bg-white/20 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[70px] cursor-none"
            onClick={() => handleRoleSwitch('FOUNDER')}
            disabled={isSwitching || user?.role === 'FOUNDER'}
          >
            {isSwitching ? <SpinnerIcon className="w-3 h-3" /> : 'Founder'}
          </button>
          <button 
            className="rounded bg-white/10 px-3 py-1.5 hover:bg-white/20 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[70px] cursor-none"
            onClick={() => handleRoleSwitch('TESTER')}
            disabled={isSwitching || user?.role === 'TESTER'}
          >
            {isSwitching ? <SpinnerIcon className="w-3 h-3" /> : 'Tester'}
          </button>
        </div>
      </div>
    </div>
  )
}
