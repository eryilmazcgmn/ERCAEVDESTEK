<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Services\Auth\JwtService;

class JwtAuthenticate
{
    protected JwtService $jwtService;

    public function __construct(JwtService $jwtService)
    {
        $this->jwtService = $jwtService;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $authHeader = $request->header('Authorization');

        if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            return response()->json([
                'status' => false,
                'message' => 'Yetkisiz erişim. Token bulunamadı.',
                'data' => null,
                'errors' => ['auth' => ['Token bulunamadı.']]
            ], 401);
        }

        $token = $matches[1];
        $decoded = $this->jwtService->decode($token);

        if (!$decoded) {
            return response()->json([
                'status' => false,
                'message' => 'Geçersiz veya süresi dolmuş token.',
                'data' => null,
                'errors' => ['auth' => ['Geçersiz veya süresi dolmuş token.']]
            ], 401);
        }

        $request->merge(['jwt_user' => $decoded]);

        return $next($request);
    }
}
