import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, ArrowLeft, ArrowRight } from '@phosphor-icons/react'

interface PhotoLightboxProps {
  photos: string[]
  initialIndex?: number
  open: boolean
  onClose: () => void
}

export function PhotoLightbox({ photos, initialIndex = 0, open, onClose }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
  }

  if (!photos || photos.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] p-0 bg-black/95 border-none">
        <div className="relative flex items-center justify-center min-h-[60vh]">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-50 text-white hover:bg-white/20 rounded-full"
            onClick={onClose}
          >
            <X size={24} weight="bold" />
          </Button>

          {/* Navigation Arrows */}
          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 z-40 text-white hover:bg-white/20 rounded-full h-12 w-12"
                onClick={handlePrev}
              >
                <ArrowLeft size={28} weight="bold" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 z-40 text-white hover:bg-white/20 rounded-full h-12 w-12"
                onClick={handleNext}
              >
                <ArrowRight size={28} weight="bold" />
              </Button>
            </>
          )}

          {/* Main Image */}
          <img
            src={photos[currentIndex]}
            alt={`Photo ${currentIndex + 1}`}
            className="max-w-full max-h-[85vh] object-contain"
          />

          {/* Image Counter */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
              {currentIndex + 1} / {photos.length}
            </div>
          )}
        </div>

        {/* Thumbnail Strip */}
        {photos.length > 1 && (
          <div className="flex justify-center gap-2 p-4 bg-black/80">
            {photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-primary scale-110'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={photo}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Hook to manage lightbox state
export function useLightbox() {
  const [lightboxState, setLightboxState] = useState<{
    open: boolean
    photos: string[]
    initialIndex: number
  }>({
    open: false,
    photos: [],
    initialIndex: 0
  })

  const openLightbox = (photos: string[], initialIndex = 0) => {
    setLightboxState({ open: true, photos, initialIndex })
  }

  const closeLightbox = () => {
    setLightboxState(prev => ({ ...prev, open: false }))
  }

  return {
    lightboxState,
    openLightbox,
    closeLightbox
  }
}
