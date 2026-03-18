"use client"

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

export function ThemeToggleButton() {
  const { darkMode, toggleDarkMode } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#ece6df] bg-white/95 text-[#1a1625] shadow-[0_18px_40px_-28px_rgba(26,22,37,0.18)] transition-colors hover:bg-[#f5f1ed] dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
    >
      {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  )
}
