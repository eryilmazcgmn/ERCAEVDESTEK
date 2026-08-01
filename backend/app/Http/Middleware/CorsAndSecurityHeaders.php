<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CorsAndSecurityHeaders
{
    /**
     * Allowed origins whitelist.
     */
    protected function getAllowedOrigins(): array
    {
        $origins = [
            config('services.frontend.url', 'http://localhost:5173'),
            config('app.url', 'http://localhost'),
        ];

        if (config('app.env') === 'local') {
            $origins[] = 'http://localhost:5173';
            $origins[] = 'http://localhost:3000';
            $origins[] = 'http://127.0.0.1:5173';
        }

        return array_unique(array_filter($origins));
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethod('OPTIONS')) {
            $response = response('', 200);
        } else {
            $response = $next($request);
        }

        $origin = $request->headers->get('Origin');
        $allowedOrigins = $this->getAllowedOrigins();

        if ($origin && in_array($origin, $allowedOrigins, true)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
            $response->headers->set('Vary', 'Origin');
        }

        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-TOKEN');
        $response->headers->set('Access-Control-Max-Age', '86400');

        // Security Headers
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $csp = "default-src 'self'; script-src 'self' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:;";
        if (config('app.env') === 'local') {
            $csp .= " connect-src 'self' http://localhost:5173 ws://localhost:5173;";
        }
        $response->headers->set('Content-Security-Policy', $csp);

        return $response;
    }
}
