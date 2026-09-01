import './global.css';
import { Geist } from 'next/font/google';

import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/providers';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: 'Pulse — The workspace for high-performing teams',
  description:
    'Align your team on goals, track progress, and ship faster with real-time dashboards, automations, and integrations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn('font-sans', geist.variable)} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
