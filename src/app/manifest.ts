import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mathex – weby na míru',
    short_name: 'Mathex',
    lang: 'cs',
    start_url: '/',
    display: 'browser',
    background_color: '#eceee6',
    theme_color: '#10302B',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  }
}
