import React, { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShow(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 bg-bg-600 border border-border-accent rounded-xl p-4 shadow-xl animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center flex-shrink-0">
          <Download size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">Instalar JL3D Studio</p>
          <p className="text-xs text-text-muted mt-0.5">Acesse direto da tela inicial do celular</p>
          <div className="flex gap-2 mt-3">
            <button onClick={handleInstall} className="btn-primary text-xs px-3 py-1.5">Instalar</button>
            <button onClick={() => setShow(false)} className="btn-ghost text-xs px-3 py-1.5">Agora não</button>
          </div>
        </div>
        <button onClick={() => setShow(false)} className="text-text-muted hover:text-text-primary transition-colors">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
