<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Models\User;
use App\Services\Auth\JwtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    protected JwtService $jwtService;

    public function __construct(JwtService $jwtService)
    {
        $this->jwtService = $jwtService;
    }

    /**
     * Authenticate admin or technician user.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $username = $request->input('username');
        $user = User::where('username', $username)->first();

        if (!$user || !Hash::check((string) $request->input('password'), $user->password)) {
            Log::warning('Failed login attempt.', [
                'username' => $username,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Geçersiz kullanıcı adı veya şifre.',
                'data' => null,
                'errors' => ['credentials' => ['Geçersiz kullanıcı adı veya şifre.']]
            ], 401);
        }

        if (! $this->jwtService->isSecretValid()) {
            Log::error('JWT secret is not configured or too short. Cannot create token.');
            return response()->json([
                'status' => false,
                'message' => 'Sunucu yapılandırma hatası: kimlik doğrulama servisi eksik.',
                'data' => null,
                'errors' => ['server' => ['Authentication configuration invalid. Contact admin.']]
            ], 500);
        }

        try {
            $token = $this->jwtService->encode([
                'id' => $user->id,
                'user_id' => $user->id,
                'role' => $user->role,
                'username' => $user->username,
            ]);
        } catch (\Throwable $e) {
            Log::error('JWT Encoding failed during login', ['exception' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Kimlik doğrulama servisi yapılandırma hatası. Lütfen yöneticiye bildirin.',
                'data' => null,
                'errors' => ['auth' => ['JWT yapılandırma hatası.']]
            ], 500);
        }

        if ($token === null) {
            Log::error('JWT encode returned null despite secret being valid. Check JWT service configuration.');
            return response()->json([
                'status' => false,
                'message' => 'Token oluşturulamadı. Sunucu hatası.',
                'data' => null,
                'errors' => ['server' => ['Token üretimi başarısız.']]
            ], 500);
        }

        Log::info('Login successful.', [
            'user_id' => $user->id,
            'username' => $user->username,
            'role' => $user->role,
            'ip' => $request->ip(),
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Giriş başarılı.',
            'data' => [
                'token' => $token,
                'role' => $user->role,
                'user_id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
            ],
            'errors' => null
        ], 200);
    }

    /**
     * Refresh an active JWT token.
     */
    public function refresh(Request $request): JsonResponse
    {
        $jwtUser = (array) $request->attributes->get('jwt_user', []);
        $userId = $this->jwtService->extractUserId($jwtUser);

        if (!$jwtUser || $userId <= 0) {
            return response()->json([
                'status' => false,
                'message' => 'Geçersiz veya süresi dolmuş oturum.',
                'data' => null,
                'errors' => null
            ], 401);
        }

        $user = User::find($userId);

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Kullanıcı bulunamadı.',
                'data' => null,
                'errors' => null
            ], 404);
        }

        if (! $this->jwtService->isSecretValid()) {
            Log::error('JWT secret is not configured or too short. Cannot create token.');
            return response()->json([
                'status' => false,
                'message' => 'Sunucu yapılandırma hatası: kimlik doğrulama servisi eksik.',
                'data' => null,
                'errors' => ['server' => ['Authentication configuration invalid. Contact admin.']]
            ], 500);
        }

        try {
            $newToken = $this->jwtService->encode([
                'id' => $user->id,
                'user_id' => $user->id,
                'role' => $user->role,
                'username' => $user->username,
            ]);
        } catch (\Throwable $e) {
            Log::error('JWT Encoding failed during refresh', ['exception' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Token yenilenirken sunucu hatası oluştu.',
                'data' => null,
                'errors' => ['auth' => ['JWT yapılandırma hatası.']]
            ], 500);
        }

        if ($newToken === null) {
            Log::error('JWT encode returned null despite secret being valid. Check JWT service configuration.');
            return response()->json([
                'status' => false,
                'message' => 'Token oluşturulamadı. Sunucu hatası.',
                'data' => null,
                'errors' => ['server' => ['Token üretimi başarısız.']]
            ], 500);
        }

        return response()->json([
            'status' => true,
            'message' => 'Token başarıyla yenilendi.',
            'data' => [
                'token' => $newToken,
                'role' => $user->role,
                'user_id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
            ],
            'errors' => null
        ], 200);
    }
}
