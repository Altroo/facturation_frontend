'use client';

import { useEffect } from 'react';

export default function ClearCookiesClient() {
  useEffect(() => {
    // fire-and-forget
    fetch('/api/clear-reset-cookies', { method: 'POST', credentials: 'same-origin' })
      .catch((err) => {
        // optional: log but do not redirect
        console.error('Failed to clear reset cookies', err);
      });
  }, []);

  return null;
}