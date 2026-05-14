/** Base URL for API calls (include `/api/v1`). Set REACT_APP_API_URL at build time for production. */
export const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5002/api/v1';
