'use client';

// CLERK AUTH TEMPORARILY DISABLED - Uncomment when needed
// import { SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { LockClosedIcon, SparklesIcon } from '@heroicons/react/24/solid';

interface SignupPromptModalProps {
    mode: 'soft' | 'hard';
    onDismiss?: () => void;
}

export function SignupPromptModal({ mode, onDismiss }: SignupPromptModalProps) {
    const isHard = mode === 'hard';

    return (
        <div className={`
      fixed inset-0 z-50 flex items-center justify-center
      ${isHard ? 'bg-black/80 backdrop-blur-md' : 'bg-black/60 backdrop-blur-sm'}
    `}>
            <div className="bg-background border border-border rounded-2xl p-8 max-w-md mx-4 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                {/* Icon */}
                <div className={`
          w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center
          ${isHard ? 'bg-red-500/20' : 'bg-gradient-to-br from-purple-500/20 to-blue-500/20'}
        `}>
                    {isHard ? (
                        <LockClosedIcon className="w-8 h-8 text-red-500" />
                    ) : (
                        <SparklesIcon className="w-8 h-8 text-purple-500" />
                    )}
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-center mb-3">
                    {isHard ? 'Search Limit Reached' : 'Unlock Unlimited Searches'}
                </h2>

                {/* Description */}
                <p className="text-muted-foreground text-center mb-6">
                    {isHard
                        ? "You've reached the free search limit. Sign in to continue discovering open source opportunities."
                        : 'Sign in to unlock unlimited searches and get the most out of GitHub Contribution Finder!'
                    }
                </p>

                {/* Benefits */}
                <ul className="space-y-2 mb-6 text-sm">
                    <li className="flex items-center gap-2 text-muted-foreground">
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Unlimited searches</span>
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Save your favorite issues</span>
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Personalized recommendations</span>
                    </li>
                </ul>

                {/* Actions - CLERK AUTH TEMPORARILY DISABLED */}
                <div className="flex flex-col gap-3">
                    {/* CLERK AUTH TEMPORARILY DISABLED - Uncomment when needed */}
                    {/* <SignInButton mode="modal">
                        <Button className="w-full font-semibold py-5">
                            Sign in with GitHub
                        </Button>
                    </SignInButton> */}
                    <Button className="w-full font-semibold py-5" disabled>
                        Sign in with GitHub (Coming Soon)
                    </Button>

                    {!isHard && onDismiss && (
                        <Button
                            variant="ghost"
                            onClick={onDismiss}
                            className="w-full text-muted-foreground hover:text-foreground"
                        >
                            Maybe later
                        </Button>
                    )}
                </div>

                {/* Footer */}
                <p className="text-xs text-muted-foreground text-center mt-4">
                    Free forever. No credit card required.
                </p>
            </div>
        </div>
    );
}
