import { Router } from 'express';

const sitemapRouter = Router();

const BASE_URL = 'https://www.ruaa-beauty.eu';

const routes = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  { url: '/book', priority: '0.9', changefreq: 'weekly' },
  { url: '/lashes', priority: '0.8', changefreq: 'monthly' },
  { url: '/makeup', priority: '0.8', changefreq: 'monthly' },
  { url: '/mehendi', priority: '0.8', changefreq: 'monthly' },
  { url: '/reviews', priority: '0.8', changefreq: 'weekly' },
  { url: '/contact', priority: '0.7', changefreq: 'monthly' },
];

sitemapRouter.get('/sitemap.xml', (req, res) => {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  routes.forEach((route) => {
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}${route.url}</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
    xml += `    <priority>${route.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>';

  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

sitemapRouter.get('/robots.txt', (req, res) => {
  let robots = 'User-agent: *\n';
  robots += 'Allow: /\n';
  robots += `Sitemap: ${BASE_URL}/sitemap.xml\n`;

  res.header('Content-Type', 'text/plain');
  res.send(robots);
});

export default sitemapRouter;
