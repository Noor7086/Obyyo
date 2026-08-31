import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSEO } from '../hooks/useSEO';

// Soro hosts the posts; this page is only a mount point for their embed script.
const SORO_EMBED_SRC = 'https://app.trysoro.com/api/embed/dc3a8279-6b45-41d3-a162-addda65e7fa6';
const SORO_CONTAINER_ID = 'soro-blog';

// How long to wait for the embed to paint before showing the fallback message.
const EMBED_TIMEOUT_MS = 10000;

type EmbedStatus = 'loading' | 'ready' | 'error';

// Soro deep-links a post as /blog?post=<slug> and pushes that URL before it
// swaps the markup, so the query string is the reliable "which view am I on".
const isPostOpen = () => new URLSearchParams(window.location.search).has('post');

const Blog: React.FC = () => {
  // Memoised so useSEO's effect runs once on mount instead of on every render.
  // Without this the object identity changes each render, and the re-run would
  // overwrite the per-article title and description that the Soro script sets.
  const seo = useMemo(
    () => ({
      title: 'Blog - Lottery Strategy, Analysis & Tips | Obyyo',
      description:
        'Expert insights, analysis and strategies to improve your lottery success. Read the latest Obyyo articles on Powerball, Mega Million, Gopher 5 and Lotto America.',
      keywords: 'lottery blog, lottery strategy, lottery analysis, lottery tips, powerball, megamillion, gopher5, lotto america',
      url: 'https://obyyo.com/blog',
      canonical: 'https://obyyo.com/blog'
    }),
    []
  );
  useSEO(seo);

  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<EmbedStatus>('loading');
  // Landing straight on /blog?post=<slug> must hide the page header on the first
  // paint, so seed this from the URL rather than waiting for the embed.
  const [isArticleOpen, setIsArticleOpen] = useState(isPostOpen);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Start from a clean slate: on a repeat visit the embed would otherwise
    // append a second copy of the post list underneath the first.
    container.innerHTML = '';
    setStatus('loading');

    // The embed paints asynchronously and gives us no callback, so watch the
    // container rather than guessing a fixed delay. It stays connected after the
    // first paint because every list <-> article switch is another rewrite in
    // here, and that is how we learn which view is showing.
    const syncView = () => setIsArticleOpen(isPostOpen());
    const observer = new MutationObserver(() => {
      if (container.childNodes.length > 0) {
        setStatus('ready');
      }
      syncView();
    });
    observer.observe(container, { childList: true, subtree: true });

    // Back/forward between a post and the list.
    window.addEventListener('popstate', syncView);

    const timeoutId = window.setTimeout(() => {
      if (container.childNodes.length === 0) {
        setStatus('error');
      }
    }, EMBED_TIMEOUT_MS);

    // React does not execute a <script> tag written in JSX, so it has to be
    // injected imperatively. Creating a fresh element on every mount is what
    // makes the embed re-run when the user navigates away from /blog and back.
    const script = document.createElement('script');
    script.src = SORO_EMBED_SRC;
    script.defer = true;
    script.onerror = () => setStatus('error');
    document.body.appendChild(script);

    return () => {
      observer.disconnect();
      window.removeEventListener('popstate', syncView);
      window.clearTimeout(timeoutId);
      script.remove();
      container.innerHTML = '';
    };
  }, []);

  // When a post is open, Soro appends its own <link rel="canonical" data-soro>
  // pointing at the article. useSEO has already added one for the list page, and
  // a page carrying two canonicals gets both ignored by crawlers — so park ours
  // while Soro's is up and put it back when the reader returns to the list.
  useEffect(() => {
    let parked: HTMLLinkElement | null = null;

    const reconcile = () => {
      const soroCanonical = document.head.querySelector('link[rel="canonical"][data-soro]');
      const ourCanonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]:not([data-soro])');

      if (soroCanonical && ourCanonical) {
        parked = ourCanonical;
        ourCanonical.remove();
      } else if (!soroCanonical && parked && !ourCanonical) {
        document.head.appendChild(parked);
        parked = null;
      }
    };

    const headObserver = new MutationObserver(reconcile);
    headObserver.observe(document.head, { childList: true });

    return () => {
      headObserver.disconnect();
      if (parked && !document.head.contains(parked)) {
        document.head.appendChild(parked);
      }
    };
  }, []);

  return (
    <div className="container py-5 mt-5">
      <div className="row">
        <div className="col-lg-10 mx-auto">
          {/* Only the list needs this. An open post renders its own <h1>, and
              stacking ours on top would leave the page with two of them. */}
          {!isArticleOpen && (
            <div className="text-center mb-5">
              <h1 className="display-4 fw-bold mb-3 gradient-text">Lottery Strategy Blog</h1>
              <p className="lead text-muted">
                Expert insights, analysis, and strategies to improve your lottery success
              </p>
            </div>
          )}

          {status === 'loading' && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading articles...</span>
              </div>
              <p className="text-muted mt-3 mb-0">Loading articles...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="card border-0 shadow-sm">
              <div className="card-body p-5 text-center">
                <i className="bi bi-journal-x fs-1 text-muted d-block mb-3"></i>
                <h5 className="fw-bold mb-2">Articles aren't available right now</h5>
                <p className="text-muted mb-0">
                  We couldn't load the blog. Please refresh the page or check back shortly.
                </p>
              </div>
            </div>
          )}

          {/* Soro renders the post list and individual posts into this node.
              It stays mounted in every state so late-arriving content still appears. */}
          <div id={SORO_CONTAINER_ID} ref={containerRef}></div>
        </div>
      </div>
    </div>
  );
};

export default Blog;
