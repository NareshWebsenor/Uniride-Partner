import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    showGlobalError?: boolean;
  }
}
