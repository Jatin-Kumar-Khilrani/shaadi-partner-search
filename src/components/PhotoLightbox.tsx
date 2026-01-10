import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, ArrowLeft, ArrowRight, ImageBroken } from '@phosphor-icons/react'

interface PhotoLightboxProps {
  photos: string[]
  initialIndex?: number
  open: boolean
  onClose: () => void
}

export function PhotoLightbox({ photos, initialIndex = 0, open, onClose }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set())
  const [imageLoading, setImageLoading] = useState(true)

  // Reset state when dialog opens or photos/initialIndex change
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex)
      setBrokenImages(new Set())
      setImageLoading(true)
    }
  }, [open, initialIndex, photos])

  const handleImageError = useCallback((index: number) => {
    setBrokenImages(prev => new Set(prev).add(index))
    setImageLoading(false)
  }, [])

  const handleImageLoad = useCallback(() => {
    setImageLoading(false)
  }, [])

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
            aria-label="Close photo viewer"
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
                aria-label="Previous photo"
              >
                <ArrowLeft size={28} weight="bold" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 z-40 text-white hover:bg-white/20 rounded-full h-12 w-12"
                onClick={handleNext}
                aria-label="Next photo"
              >
                <ArrowRight size={28} weight="bold" />
              </Button>
            </>
          )}

          {/* Main Image */}
          {brokenImages.has(currentIndex) ? (
            <div className="flex flex-col items-center justify-center text-white/60 gap-4 p-8">
              <ImageBroken size={64} weight="thin" />
              <p className="text-sm">Image could not be loaded</p>
            </div>
          ) : (
            <>
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
              <img
                src={photos[currentIndex]}
                alt={`Photo ${currentIndex + 1}`}
                className={`max-w-full max-h-[85vh] object-contain transition-opacity ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                onError={() => handleImageError(currentIndex)}
                onLoad={handleImageLoad}
              />
            </>
          )}

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
                onClick={() => {
                  setCurrentIndex(index)
                  setImageLoading(true)
                }}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-primary scale-110'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
                aria-label={`View photo ${index + 1}`}
              >
                {brokenImages.has(index) ? (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <ImageBroken size={20} weight="thin" className="text-gray-500" />
                  </div>
                ) : (
                  <img
                    src={photo}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(index)}
                  />
                )}
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
