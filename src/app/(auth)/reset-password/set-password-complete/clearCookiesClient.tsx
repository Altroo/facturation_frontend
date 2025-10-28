'use client';

import { useEffect } from 'react';
import clearResetCookies from "./clearCookies.server";

export default function ClearCookiesClient() {
  useEffect(() => {
    // fire‑and‑forget the server action
    clearResetCookies().then();
  }, []);

  return null;
}
