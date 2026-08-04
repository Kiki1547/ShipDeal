import type { Metadata } from 'next'
import './globals.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'ShipDeal — FedEx Labels at Unbeatable Prices',
  description: 'Buy FedEx International Priority shipping labels instantly. Starting from $2.40. No subscription, no hidden fees.',
  keywords: 'FedEx label, shipping label, international shipping, cheap shipping, FedEx discount',
  openGraph: {
    title: 'ShipDeal — FedEx Labels at Unbeatable Prices',
    description: 'Buy FedEx International Priority shipping labels instantly. Starting from $2.40.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
