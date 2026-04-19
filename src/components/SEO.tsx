import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'software';
  keywords?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title = 'Kiosko de Impresión Fotográfica | Nexo Network Ec',
  description = 'Servicio profesional de impresión de fotos carnet, pasaporte y postales en Ecuador. Calidad fotográfica con precisión milimétrica.',
  canonical = 'https://nexo-kiosk.example.com', // Replace with real domain if available
  ogImage = 'https://picsum.photos/seed/kiosk-seo/1200/630',
  ogType = 'website',
  keywords = 'impresion fotos, foto carnet ecuador, foto pasaporte, kiosko fotos, nexo network ec, impresion postal'
}) => {
  const siteName = 'Nexo Network Ec';
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Application Meta */}
      <meta name="application-name" content={siteName} />
      <meta name="apple-mobile-web-app-title" content={siteName} />
    </Helmet>
  );
};

export const StructuredData: React.FC = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Kiosko de Impresión Nexo",
    "operatingSystem": "Web, Windows, Android, iOS",
    "applicationCategory": "MultimediaApplication",
    "description": "Software profesional para el procesamiento e impresión de fotografía de documentos y postales.",
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Nexo Network Ec",
      "logo": {
        "@type": "ImageObject",
        "url": "https://picsum.photos/seed/nexo-logo/200/200"
      }
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};
