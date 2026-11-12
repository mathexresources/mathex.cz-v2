import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mathex – weby na míru',
    short_name: 'Mathex',
    lang: 'cs',
    start_url: '/',
    display: 'browser',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  }
}
