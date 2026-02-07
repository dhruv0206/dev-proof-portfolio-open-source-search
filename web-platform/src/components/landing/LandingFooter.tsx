'use client';

import { motion } from 'framer-motion';
import { Github, Twitter, MessageCircle } from 'lucide-react';

const footerLinks = {
    product: [
        { name: 'Features', href: '#features' },
        { name: 'How It Works', href: '#how-it-works' },
        { name: 'Issue Finder', href: '/finder' },
    ],
    resources: [
        { name: 'Documentation', href: '#' },
        { name: 'Contributing', href: 'https://github.com/dhruv0206/opensource-issues-finder/blob/master/CONTRIBUTING.md' },
        { name: 'Changelog', href: '#' },
    ],
    legal: [
        { name: 'Privacy', href: '#' },
        { name: 'Terms', href: '#' },
    ],
};

const socialLinks = [
    { name: 'GitHub', href: 'https://github.com/dhruv0206/opensource-issues-finder', icon: Github },
    { name: 'Twitter', href: '#', icon: Twitter },
    { name: 'Discord', href: 'https://discord.gg/dZRFt9kN', icon: MessageCircle },
];

export function LandingFooter() {
    return (
        <footer className="border-t border-border bg-background/50 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    {/* Brand */}
                    <div className="col-span-2 lg:col-span-1 border-b lg:border-0 pb-8 lg:pb-0 border-border">
                        <a href="/" className="flex items-center gap-2 mb-4 justify-center lg:justify-start">
                            <img src="/logo_transparent.png" alt="DevProof" className="w-8 h-8" />
                            <span className="text-xl font-bold">DevProof</span>
                        </a>
                        <p className="text-sm text-muted-foreground mb-4 text-center lg:text-left">
                            Prove your code. Build your credibility.
                        </p>
                        <div className="flex gap-3 justify-center lg:justify-start">
                            {socialLinks.map((social) => (
                                <motion.a
                                    key={social.name}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ scale: 1.1 }}
                                    className="w-9 h-9 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <social.icon className="w-4 h-4" />
                                </motion.a>
                            ))}
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="font-semibold mb-4">Product</h4>
                        <ul className="space-y-2">
                            {footerLinks.product.map((link) => (
                                <li key={link.name}>
                                    <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="font-semibold mb-4">Resources</h4>
                        <ul className="space-y-2">
                            {footerLinks.resources.map((link) => (
                                <li key={link.name}>
                                    <a
                                        href={link.href}
                                        target={link.href.startsWith('http') ? '_blank' : undefined}
                                        rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2">
                            {footerLinks.legal.map((link) => (
                                <li key={link.name}>
                                    <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} DevProof. Built with 💜 for developers.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Made by <a href="https://github.com/dhruv0206" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Dhruv</a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
