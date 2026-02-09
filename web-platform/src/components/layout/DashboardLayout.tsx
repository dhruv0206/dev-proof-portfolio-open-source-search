'use client';

import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { BetaBanner } from '@/components/layout/BetaBanner';
import { FeedbackBanner } from '@/components/shared/FeedbackBanner';
import { SidebarProvider, useSidebar } from '@/components/layout/SidebarContext';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </SidebarProvider>
    );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const { state, isMobile, setOpenMobile } = useSidebar();

    return (
        <div className="min-h-screen bg-background">
            <DashboardSidebar />

            {/* Mobile Header */}
            {isMobile && (
                <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => setOpenMobile(true)}>
                            <Menu className="h-5 w-5" />
                        </Button>
                        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                            <img src="/logo_transparent.png" alt="DevProof" className="h-8 w-8 object-contain" />
                            <span>DevProof</span>
                        </Link>
                    </div>
                    <ThemeToggle />
                </header>
            )}

            {/* Main Content Area */}
            <div
                className={cn(
                    "transition-all duration-300 ease-in-out",
                    isMobile ? "pl-0" : (state === 'collapsed' ? "pl-16" : "pl-64")
                )}
            >
                {/* Desktop Header for Dashboard (hidden on mobile since we have mobile header) */}
                {!isMobile && (
                    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border px-8 py-4 flex items-center justify-end">
                        <ThemeToggle />
                    </header>
                )}

                <FeedbackBanner />
                <BetaBanner />

                {children}
            </div>
        </div>
    );
}
