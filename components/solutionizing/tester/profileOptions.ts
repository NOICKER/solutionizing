export const expertiseTagOptions = [
  'Tech',
  'Finance',
  'Health',
  'Education',
  'Ecommerce',
  'Design',
  'Marketing',
  'Gaming',
  'Other',
] as const

export type ExpertiseTag = (typeof expertiseTagOptions)[number]
export type PreferredDevice = 'desktop' | 'mobile' | 'both'

export const preferredDeviceOptions: Array<{
  value: PreferredDevice
  label: string
  description: string
  glyph: string
}> = [
  {
    value: 'desktop',
    label: 'Desktop',
    description: 'Best when you mostly test full web flows and detailed layouts.',
    glyph: 'desktop_windows',
  },
  {
    value: 'mobile',
    label: 'Mobile',
    description: 'Ideal for app journeys, mobile-first checks, and quick feedback loops.',
    glyph: 'smartphone',
  },
  {
    value: 'both',
    label: 'Both',
    description: 'Use this if you regularly switch between desktop and mobile test sessions.',
    glyph: 'devices',
  },
]
