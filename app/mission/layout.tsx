import { ThemeProvider } from '@/context/ThemeContext'

export default function MissionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ThemeProvider>{children}</ThemeProvider>
}
