'use client';

import { useEffect } from 'react';
import {cookiesDeleter} from "@/store/services/_init/_initAPI";

export default function ClearCookiesClient() {
  useEffect(() => {
    cookiesDeleter('/cookies', {
      pass_updated: true,
      new_email: true,
      code: true,
    }).catch((err) => {
      console.error('Failed to clear reset cookies', err);
    });
  }, []);

  return null;
}
