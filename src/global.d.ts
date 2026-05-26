import type { EnzymeApi } from '../electron/preload';

declare global {
  interface Window {
    enzymeApi: EnzymeApi;
    iredApi?: EnzymeApi;
  }
}
