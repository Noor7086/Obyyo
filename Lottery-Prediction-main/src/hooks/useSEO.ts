import { useEffect } from 'react';

export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  siteName?: string;
  twitterCard?: string;
  twitterSite?: string;
  twitterCreator?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  canonical?: string;
  robots?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

const defaultSEO: SEOData = {
  title: 'Obyyo - Lottery Prediction Platform',
  description: 'Enhance your lottery winning odds with 80-100% accurate predictions. Reduce waste on low vibration numbers. Get 7 days free trial for Powerball, Mega Million, Gopher 5, Pick 3, and Lotto America.',
  keywords: 'lottery prediction, lottery numbers, winning odds, powerball, megamillion, gopher5, pick3, lotto america, lottery analysis, number prediction',
  image: '/logo.png',
  url: 'https://obyyo.com',
  type: 'website',
  siteName: 'Obyyo',
  twitterCard: 'summary_large_image',
  robots: 'index, follow',
};

/**
 * Custom hook to manage SEO meta tags dynamically
 * @param seoData - SEO data object containing title, description, keywords, etc.
 */
export const useSEO = (seoData: SEOData = {}) => {
  useEffect(() => {
    // Merge with defaults
    const finalSEO = { ...defaultSEO, ...seoData };

    // Update document title
    if (finalSEO.title) {
      document.title = finalSEO.title;
    }

    // Helper function to update or create meta tag
    const updateMetaTag = (name: string, content: string, attribute: string = 'name') => {
      if (!content) return;

      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper function to update or create link tag
    const updateLinkTag = (rel: string, href: string) => {
      if (!href) return;

      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // Basic meta tags
    updateMetaTag('description', finalSEO.description || '');
    updateMetaTag('keywords', finalSEO.keywords || '');
    updateMetaTag('author', finalSEO.author || 'Obyyo');
    updateMetaTag('robots', finalSEO.robots || (finalSEO.noindex ? 'noindex' : 'index') + ', ' + (finalSEO.nofollow ? 'nofollow' : 'follow'));

    // Open Graph meta tags
    updateMetaTag('og:title', finalSEO.ogTitle || finalSEO.title || '');
    updateMetaTag('og:description', finalSEO.ogDescription || finalSEO.description || '');
    updateMetaTag('og:image', finalSEO.ogImage || finalSEO.image || '');
    updateMetaTag('og:url', finalSEO.ogUrl || finalSEO.url || '');
    updateMetaTag('og:type', finalSEO.ogType || finalSEO.type || 'website');
    updateMetaTag('og:site_name', finalSEO.siteName || 'Obyyo');

    // Twitter Card meta tags
    updateMetaTag('twitter:card', finalSEO.twitterCard || 'summary_large_image');
    if (finalSEO.twitterSite) {
      updateMetaTag('twitter:site', finalSEO.twitterSite);
    }
    if (finalSEO.twitterCreator) {
      updateMetaTag('twitter:creator', finalSEO.twitterCreator);
    }
    updateMetaTag('twitter:title', finalSEO.ogTitle || finalSEO.title || '');
    updateMetaTag('twitter:description', finalSEO.ogDescription || finalSEO.description || '');
    updateMetaTag('twitter:image', finalSEO.ogImage || finalSEO.image || '');

    // Canonical URL
    if (finalSEO.canonical) {
      updateLinkTag('canonical', finalSEO.canonical);
    } else if (finalSEO.url) {
      updateLinkTag('canonical', finalSEO.url);
    }

    // Cleanup function to restore defaults when component unmounts
    return () => {
      // Optionally restore default title
      if (seoData.title) {
        document.title = defaultSEO.title || 'Obyyo - Lottery Prediction Platform';
      }
    };
  }, [seoData]);
};
