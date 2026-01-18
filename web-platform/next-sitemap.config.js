/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://dev-proof-portfolio.vercel.app',
    generateRobotsTxt: true,
    changefreq: 'daily',
    priority: 0.7,
    sitemapSize: 5000,
    exclude: [],
    robotsTxtOptions: {
        policies: [
            {
                userAgent: '*',
                allow: '/',
            },
        ],
    },
}
