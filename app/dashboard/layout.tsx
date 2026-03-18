import { ThemeProvider } from '@/context/ThemeContext'

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
