"use client"

import { useEffect, useState } from 'react'

type ToastVariant = 'success' | 'error' | 'info'

type ToastMessage = {
  id: number
  message: string
  variant: ToastVariant
}

type ToastListener = (messages: ToastMessage[]) => void

let nextToastId = 1
let activeToasts: ToastMessage[] = []
const listeners = new Set<ToastListener>()

function emit() {
  listeners.forEach((listener) => listener(activeToasts))
}

function addToast(message: string, variant: ToastVariant) {
  const id = nextToastId++
  activeToasts = [{ id, message, variant }, ...activeToasts].slice(0, 3)
  emit()

  window.setTimeout(() => {
    activeToasts = activeToasts.filter((toast) => toast.id !== id)
    emit()
  }, 4000)

  return id
}

export const toast = {
  success(message: string) {
    return addToast(message, 'success')
  },
  error(message: string) {
    return addToast(message, 'error')
  },
  info(message: string) {
    return addToast(message, 'info')
  },
}

function getToastClasses(variant: ToastVariant) {
  if (variant === 'success') {
    return 'border-green-200 bg-green-50 text-green-900'
  }

  if (variant === 'error') {
    return 'border-red-200 bg-red-50 text-red-900'
  }

  return 'border-blue-200 bg-blue-50 text-blue-900'
}

export function Toaster() {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  useEffect(() => {
    const listener: ToastListener = (nextMessages) => {
      setMessages(nextMessages)
    }

    listeners.add(listener)
    listener(activeToasts)

    return () => {
      listeners.delete(listener)
    }
  }, [])

  if (messages.length === 0) {
    return null
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`rounded-2xl border px-4 py-3 shadow-lg ${getToastClasses(message.variant)}`}
        >
          <p className="text-sm font-semibold">{message.message}</p>
        </div>
      ))}
    </div>
  )
}
