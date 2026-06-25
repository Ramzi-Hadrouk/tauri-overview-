import '@/frontend/styles/globals.css';

import type { Metadata } from 'next';
import { ClientLayout } from './ClientLayout';

export const metadata: Metadata = {
  title: 'Client Manager',
  description: 'Desktop client management application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
