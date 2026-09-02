function prefersAppleMaps(userAgent: string): boolean {
  return (
    /iPad|iPhone|iPod/.test(userAgent) ||
    (/Macintosh/.test(userAgent) && /Mobile/.test(userAgent))
  )
}

/** Opens Apple Maps on iOS, Google Maps everywhere else (including the native app on Android). */
export function mapsSearchUrl(
  query: string,
  userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent,
): string {
  const encoded = encodeURIComponent(query)
  if (prefersAppleMaps(userAgent)) {
    return `https://maps.apple.com/?q=${encoded}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`
}
