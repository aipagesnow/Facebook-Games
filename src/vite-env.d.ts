/// <reference types="vite/client" />

import type { StudioAPI } from './types/api';

declare global {
  interface Window {
    fgs?: StudioAPI;
  }
}

export {};
