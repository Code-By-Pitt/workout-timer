const cache = new Map<string, HTMLAudioElement>();

export function preloadSound(src: string) {
  if (!cache.has(src)) {
    const audio = new Audio(src);
    audio.load();
    cache.set(src, audio);
  }
}

export function playSound(src: string) {
  let audio = cache.get(src);
  if (!audio) {
    audio = new Audio(src);
    cache.set(src, audio);
  }
  audio.currentTime = 0;
  audio.play().catch(() => {});
}
