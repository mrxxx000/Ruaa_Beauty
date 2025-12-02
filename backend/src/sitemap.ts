import { Router, Request, Response } from 'express';

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

sitemapRouter.get('/sitemap.xml', (req: Request, res: Response) => {
  try {
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

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Content-Length', Buffer.byteLength(xml, 'utf-8').toString());
    res.status(200).send(xml);
    console.log('✅ Sitemap served successfully');
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

sitemapRouter.get('/robots.txt', (req: Request, res: Response) => {
  try {
    let robots = 'User-agent: *\n';
    robots += 'Allow: /\n';
    robots += `Sitemap: ${BASE_URL}/sitemap.xml\n`;

    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.set('Content-Length', Buffer.byteLength(robots, 'utf-8').toString());
    res.status(200).send(robots);
    console.log('✅ Robots.txt served successfully');
  } catch (error) {
    console.error('❌ Error generating robots.txt:', error);
    res.status(500).send('Error generating robots.txt');
  }
});

export default sitemapRouter;
