'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { MessageSquare, X, Send, Undo2, Trash2, CheckCircle2, Loader2, PenTool } from 'lucide-react'
import { usePathname } from 'next/navigation'
import html2canvas from 'html2canvas'
import { apiFetch } from '@/lib/api/client'
import { toast } from '@/components/ui/sonner'

type Point = { x: number; y: number }
type Stroke = Point[]

const CATEGORIES = ['Bug', 'Suggestion', 'Compliment', 'Other']

export default function FeedbackWidget() {
  const pathname = usePathname()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null)
  
  // Drawing state
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  
  // Form state
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Waitlist state
  const [showWaitlist, setShowWaitlist] = useState(false)
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const resetState = useCallback(() => {
    setIsOpen(false)
    setIsCapturing(false)
    setIsDrawingMode(false)
    setScreenshotDataUrl(null)
    setStrokes([])
    setCurrentStroke(null)
    setMessage('')
    setCategory(CATEGORIES[0])
    setIsSubmitting(false)
    setShowWaitlist(false)
    setWaitlistEmail('')
    setWaitlistSubmitted(false)
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') resetState()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [resetState])

  const drawAllStrokes = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--electric').trim() || '#ff6b1a'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const allStrokes = [...strokes]
    if (currentStroke) allStrokes.push(currentStroke)

    allStrokes.forEach(stroke => {
      if (stroke.length === 0) return
      ctx.beginPath()
      ctx.moveTo(stroke[0].x, stroke[0].y)
      stroke.forEach(p => ctx.lineTo(p.x, p.y))
      ctx.stroke()
    })
  }, [strokes, currentStroke])

  useEffect(() => {
    if (isDrawingMode && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) drawAllStrokes(ctx)
    }
  }, [strokes, currentStroke, isDrawingMode, drawAllStrokes])

  const handleCapture = async () => {
    const isMobile = 'ontouchstart' in window && window.innerWidth < 768
    
    setIsCapturing(true)
    
    try {
      const widgetEls = document.querySelectorAll('[data-feedback-widget]')
      widgetEls.forEach(el => (el as HTMLElement).style.display = 'none')
      
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        scale: window.devicePixelRatio,
        logging: false,
        ignoreElements: (el) => el.hasAttribute('data-feedback-widget')
      })
      
      widgetEls.forEach(el => (el as HTMLElement).style.display = '')
      
      const dataUrl = canvas.toDataURL('image/png')
      setScreenshotDataUrl(dataUrl)
      
      if (isMobile) {
        setIsOpen(true)
      } else {
        setIsDrawingMode(true)
      }
    } catch (err) {
      console.error('Failed to capture screenshot', err)
      // Fallback to text-only if screenshot fails
      setIsOpen(true)
    } finally {
      setIsCapturing(false)
    }
  }

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current || !imgRef.current) return null
    const rect = imgRef.current.getBoundingClientRect()
    
    let clientX, clientY
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = (e as React.MouseEvent).clientX
      clientY = (e as React.MouseEvent).clientY
    }
    
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDrawing(true)
    const point = getCanvasPoint(e)
    if (point) setCurrentStroke([point])
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentStroke) return
    e.preventDefault()
    const point = getCanvasPoint(e)
    if (point) setCurrentStroke([...currentStroke, point])
  }

  const endDrawing = () => {
    setIsDrawing(false)
    if (currentStroke) {
      setStrokes([...strokes, currentStroke])
      setCurrentStroke(null)
    }
  }

  const handleDrawDone = async () => {
    if (!imgRef.current || !canvasRef.current || strokes.length === 0) {
      setIsOpen(true)
      setIsDrawingMode(false)
      return
    }

    // Merge image and drawings
    const mergedCanvas = document.createElement('canvas')
    mergedCanvas.width = canvasRef.current.width
    mergedCanvas.height = canvasRef.current.height
    const ctx = mergedCanvas.getContext('2d')
    
    if (ctx) {
      ctx.drawImage(imgRef.current, 0, 0, mergedCanvas.width, mergedCanvas.height)
      ctx.drawImage(canvasRef.current, 0, 0)
      setScreenshotDataUrl(mergedCanvas.toDataURL('image/png'))
    }
    
    setIsDrawingMode(false)
    setIsOpen(true)
  }

  const submitFeedback = async () => {
    if (!message.trim()) return
    setIsSubmitting(true)

    try {
      let uploadedUrl = null

      if (screenshotDataUrl) {
        const res = await fetch(screenshotDataUrl)
        const blob = await res.blob()
        const file = new File([blob], 'screenshot.png', { type: 'image/png' })
        
        const formData = new FormData()
        formData.append('file', file)

        const uploadRes = await fetch('/api/v1/feedback/upload', {
          method: 'POST',
          body: formData
        })

        if (uploadRes.ok) {
          const { data } = await uploadRes.json()
          uploadedUrl = data?.url
        }
      }

      await apiFetch('/api/v1/feedback', {
        method: 'POST',
        body: JSON.stringify({
          message,
          category,
          page: pathname,
          screenshotUrl: uploadedUrl
        })
      })

      toast.success('Thanks for your feedback!')
      resetState()
    } catch (err) {
      toast.error('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitWaitlist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!waitlistEmail) return
    try {
      await apiFetch('/api/v1/feedback/waitlist', {
        method: 'POST',
        body: JSON.stringify({ email: waitlistEmail })
      })
      setWaitlistSubmitted(true)
      setTimeout(() => setShowWaitlist(false), 2000)
    } catch {
      toast.error('Failed to join waitlist')
    }
  }

  // --- Render ---

  if (isDrawingMode && screenshotDataUrl) {
    return (
      <div className="fixed inset-0 z-[10000] bg-black/80 flex flex-col items-center justify-center select-none" data-feedback-widget>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[var(--cream)] text-[var(--ink)] px-6 py-3 rounded-full flex items-center gap-4 shadow-xl z-50">
          <div className="flex items-center gap-2 text-sm font-medium mr-4 border-r border-[var(--border)] pr-4">
            <PenTool size={16} className="text-[var(--electric)]" />
            <span>Circle what&apos;s wrong</span>
          </div>
          <button onClick={() => setStrokes(strokes.slice(0, -1))} disabled={strokes.length === 0} className="p-2 hover:bg-[var(--bg)] rounded-full disabled:opacity-50 transition-colors cursor-none" title="Undo">
            <Undo2 size={18} />
          </button>
          <button onClick={() => setStrokes([])} disabled={strokes.length === 0} className="p-2 hover:bg-[var(--bg)] rounded-full disabled:opacity-50 transition-colors text-red-500 cursor-none" title="Clear All">
            <Trash2 size={18} />
          </button>
          <div className="w-px h-6 bg-[var(--border)] mx-2" />
          <button onClick={handleDrawDone} className="bg-[var(--electric)] hover:bg-[var(--electric-hover)] text-white px-5 py-2 rounded-full text-sm font-bold transition-colors shadow-md cursor-none">
            Done
          </button>
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">
          Press ESC to cancel
        </div>
        
        <div 
          ref={containerRef}
          className="relative max-w-[90vw] max-h-[80vh] cursor-crosshair overflow-hidden rounded-lg shadow-2xl ring-1 ring-white/10"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            ref={imgRef}
            src={screenshotDataUrl} 
            alt="Screenshot" 
            className="w-auto h-auto max-w-full max-h-[80vh] object-contain block pointer-events-none"
            onLoad={(e) => {
              if (canvasRef.current) {
                canvasRef.current.width = e.currentTarget.naturalWidth
                canvasRef.current.height = e.currentTarget.naturalHeight
              }
            }}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={endDrawing}
          />
        </div>
      </div>
    )
  }

  return (
    <>
      <button
        data-feedback-widget
        onClick={handleCapture}
        disabled={isCapturing}
        className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-2 rounded-full bg-[var(--electric)] px-5 py-3 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl hover:bg-[var(--electric-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--electric-dim)] focus:ring-offset-2 cursor-none ${isCapturing ? 'opacity-80 scale-95 pointer-events-none' : ''}`}
        style={isCapturing ? { animation: 'feedback-capture-pulse 1.5s infinite' } : {}}
      >
        {isCapturing ? <Loader2 size={18} className="animate-spin" /> : <MessageSquare size={18} />}
        {isCapturing ? 'Capturing...' : 'Feedback Solutionizing'}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200" data-feedback-widget>
          <div className="w-full max-w-md rounded-2xl bg-[var(--cream)] p-6 shadow-2xl ring-1 ring-[var(--border)] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--ink)]">Send Feedback</h2>
              <button onClick={resetState} className="rounded-full p-2 text-[var(--ink-soft)] hover:bg-[var(--bg)] hover:text-[var(--ink)] transition-colors cursor-none">
                <X size={20} />
              </button>
            </div>

            {screenshotDataUrl && (
              <div className="mb-4 relative rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg)] group h-32 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={screenshotDataUrl} alt="Screenshot preview" className="max-h-full max-w-full object-cover" />
                <button 
                  onClick={() => setScreenshotDataUrl(null)}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-none"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            <div className="mb-4 flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-none ${category === cat ? 'bg-[var(--electric)] border-[var(--electric)] text-white' : 'bg-[var(--cream)] border-[var(--border)] text-[var(--ink-soft)] hover:bg-[var(--bg)] hover:text-[var(--ink)]'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <textarea
              placeholder="What's on your mind? Did you find a bug?"
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="mb-4 w-full h-32 resize-none rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:border-[var(--electric)] focus:outline-none focus:ring-1 focus:ring-[var(--electric-dim)] cursor-none"
            />

            <button
              onClick={submitFeedback}
              disabled={!message.trim() || isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--electric)] py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[var(--electric-hover)] disabled:opacity-50 disabled:pointer-events-none cursor-none"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              Submit Feedback
            </button>

            <div className="mt-6 border-t border-[var(--border)] pt-4 text-center">
              {!showWaitlist ? (
                <button onClick={() => setShowWaitlist(true)} className="text-xs text-[var(--ink-soft)] hover:text-[var(--electric)] transition-colors cursor-none">
                  Want this widget on your own product? Join the waitlist.
                </button>
              ) : (
                <form onSubmit={submitWaitlist} className="flex flex-col items-center gap-2">
                  {waitlistSubmitted ? (
                    <div className="flex items-center gap-2 text-xs text-green-500 font-medium">
                      <CheckCircle2 size={16} /> Added to waitlist!
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-[var(--ink)] mb-1">Get early access to our standalone feedback widget.</p>
                      <div className="flex w-full gap-2">
                        <input
                          type="email"
                          required
                          placeholder="Your email address"
                          value={waitlistEmail}
                          onChange={e => setWaitlistEmail(e.target.value)}
                          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--ink)] focus:border-[var(--electric)] focus:outline-none cursor-none"
                        />
                        <button type="submit" className="rounded-lg bg-[var(--cream)] border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--bg)] transition-colors cursor-none">
                          Join
                        </button>
                      </div>
                    </>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
