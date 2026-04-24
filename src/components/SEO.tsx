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
  title = 'Foto Estudio App | Centro de Impresión Profesional',
  description = 'La solución inteligente para estudios y kioskos de fotografía. IA para corrección de imagen, eliminación de fondos y gestión integral.',
  canonical = 'https://foto-estudio.app', // Replace with real domain if available
  ogImage = 'https://picsum.photos/seed/foto-estudio-seo/1200/630',
  ogType = 'website',
  keywords = 'impresion fotos, foto estudio app, foto carnet, foto pasaporte, kiosko inteligente, inteligencia artificial fotos'
}) => {
  const siteName = 'Foto Estudio App';
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
    "name": "Foto Estudio App",
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
      "name": "Foto Estudio Team",
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
