'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import { type EmblaCarouselType, type EmblaOptionsType } from 'embla-carousel' // Corrected import
import Autoplay from 'embla-carousel-autoplay'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type PropType = {
  slides: string[]
  options?: EmblaOptionsType
}

export const ImageSlider: React.FC<PropType> = (props) => {
  const { slides, options } = props
  const [emblaRef, emblaApi] = useEmblaCarousel({ ...options, loop: true }, [Autoplay()])

  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true)
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true)

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setPrevBtnDisabled(!emblaApi.canScrollPrev())
    setNextBtnDisabled(!emblaApi.canScrollNext())
  }, [])

  useEffect(() => {
    if (!emblaApi) return

    onSelect(emblaApi)
    emblaApi.on('reInit', onSelect)
    emblaApi.on('select', onSelect)
  }, [emblaApi, onSelect])

  return (
    <div className="relative">
      <div
        className="embla"
        ref={emblaRef}
      >
        <div className="embla__container">
          {slides.map((src, index) => (
            <div
              className="embla__slide"
              key={index}
            >
              <Image
                src={src}
                width={300}
                height={800}
                alt={`screenshot ${index + 1}`}
                className="mx-auto"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        className="absolute top-1/2 left-2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white disabled:opacity-30 transition-opacity cursor-pointer hover:bg-black"
        onClick={scrollPrev}
        disabled={prevBtnDisabled}
        aria-label="Previous slide"
      >
        <ChevronLeft />
      </button>
      <button
        className="absolute top-1/2 right-2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white disabled:opacity-30 transition-opacity cursor-pointer hover:bg-black"
        onClick={scrollNext}
        disabled={nextBtnDisabled}
        aria-label="Next slide"
      >
        <ChevronRight />
      </button>
    </div>
  )
}
