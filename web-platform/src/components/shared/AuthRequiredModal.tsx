'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Github, Lock } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

interface AuthRequiredModalProps {
    title?: string;
    message?: string;
}

export function AuthRequiredModal({
    title = "Sign in to continue",
    message = "This feature requires you to be signed in with GitHub."
}: AuthRequiredModalProps) {
    const handleSignIn = () => {
        authClient.signIn.social({
            provider: 'github',
            callbackURL: window.location.pathname,
        });
    };

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <Lock className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-center text-muted-foreground">
                        {message}
                    </p>

                    <Button
                        onClick={handleSignIn}
                        className="w-full gap-2"
                        size="lg"
                    >
                        <Github className="h-5 w-5" />
                        Sign in with GitHub
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                        By signing in, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
