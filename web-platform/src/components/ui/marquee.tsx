'use client';

import { type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

interface MarqueeProps extends ComponentPropsWithoutRef<'div'> {
    reverse?: boolean;
    pauseOnHover?: boolean;
    children: React.ReactNode;
    vertical?: boolean;
    repeat?: number;
}

export function Marquee({
    className,
    reverse = false,
    pauseOnHover = false,
    children,
    vertical = false,
    repeat = 4,
    ...props
}: MarqueeProps) {
    return (
        <div
            {...props}
            className={cn(
                'group flex gap-[--gap] overflow-hidden p-2 [--duration:40s] [--gap:1rem]',
                vertical ? 'flex-col' : 'flex-row',
                className
            )}
        >
            {Array(repeat)
                .fill(0)
                .map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            'flex shrink-0 justify-around gap-[--gap]',
                            vertical ? 'animate-marquee-vertical flex-col' : 'animate-marquee flex-row',
                            pauseOnHover && 'group-hover:[animation-play-state:paused]',
                            reverse && '[animation-direction:reverse]',
                        )}
                    >
                        {children}
                    </div>
                ))}
        </div>
    );
}
