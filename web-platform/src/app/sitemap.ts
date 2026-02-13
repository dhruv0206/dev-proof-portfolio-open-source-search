import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://orenda.vision'

    // Static routes
    const staticRoutes = [
        '',           // Homepage
        '/finder',    // Issue finder
        '/dashboard', // User dashboard
        '/settings',  // User settings
        '/profile',   // User profile
    ]

    return staticRoutes.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1.0 : 0.8,
    }))
}
