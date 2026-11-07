import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/auditor/'],
    },
    sitemap: 'https://bytebank.sim/sitemap.xml',
  };
}

