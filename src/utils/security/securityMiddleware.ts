import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Lista de origens permitidas para CORS
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://finflow.app',
  'https://*.finflow.app',
];

// Configuração de CSP
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' *.finflow.app",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

/**
 * Middleware de segurança HTTP
 */
export function securityMiddleware(request: NextRequest) {
  const response = NextResponse.next();
  const origin = request.headers.get('origin');

  // Configuração de CORS
  if (origin && ALLOWED_ORIGINS.some(o => origin.match(new RegExp(`^${o}$`.replace('*', '.*'))))) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Configuração de cabeçalhos de segurança
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  response.headers.set('Content-Security-Policy', CONTENT_SECURITY_POLICY);
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-Content-Security-Policy', CONTENT_SECURITY_POLICY);
  response.headers.set('X-WebKit-CSP', CONTENT_SECURITY_POLICY);

  // Configuração de cache
  if (request.nextUrl.pathname.match(/\.(js|css|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    response.headers.set('Cache-Control', 'no-store, max-age=0');
  }

  return response;
}
