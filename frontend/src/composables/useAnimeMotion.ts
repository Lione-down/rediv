import { animate } from 'animejs'

export function useAnimeMotion() {
  function press(target: string | HTMLElement) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    animate(target, {
      scale: [0.98, 1],
      duration: 180,
      ease: 'outQuad',
    })
  }

  function enter(target: string | HTMLElement) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    animate(target, {
      opacity: [0, 1],
      translateY: [6, 0],
      duration: 220,
      ease: 'outQuad',
    })
  }

  return { press, enter }
}
