<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class AdminRoleCheck
{
    /**
     * Verify that the authenticated JWT user has admin role.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $jwtUser = $request->input('jwt_user');

        if (!$jwtUser || ($jwtUser['role'] ?? '') !== 'admin') {
            Log::warning('Unauthorized admin access attempt.', [
                'jwt_user' => $jwtUser,
                'ip' => $request->ip(),
                'uri' => $request->getRequestUri(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Bu işlem için yönetici yetkisi gereklidir.',
                'data' => null,
                'errors' => ['auth' => ['Bu işlem için yönetici yetkisi gereklidir.']]
            ], 403);
        }

        return $next($request);
    }
}
