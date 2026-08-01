<?php

declare(strict_types=1);

namespace App\Services\Auth;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;
use Illuminate\Support\Facades\Log;

class JwtService
{
    protected string $secret;
    protected string $algorithm;
    protected int $ttl;
    protected bool $secretValid;

    public function isSecretValid(): bool
    {
        return $this->secretValid;
    }

    /**
     * Extract canonical user id from decoded JWT payload.
     */
    public function extractUserId(array $decoded): int
    {
        return (int) ($decoded['id'] ?? $decoded['user_id'] ?? 0);
    }

    public function __construct()
    {
        $this->secret = config('services.jwt.secret', '');
        $this->algorithm = config('services.jwt.algorithm', 'HS256');
        $this->ttl = config('services.jwt.ttl', 86400);

        if (empty($this->secret) || strlen($this->secret) < 32) {
            Log::warning('JWT_SECRET is not configured or is too short (min 32 chars). JWT operations will fail until configured. Check .env and config/services.php.');
            $this->secretValid = false;
        } else {
            $this->secretValid = true;
        }
    }

    /**
     * Helper to extract canonical user ID from decoded JWT payload array.
     */
    public static function getUserId(?array $jwtUser): int
    {
        if (!$jwtUser) {
            return 0;
        }

        return (int) ($jwtUser['id'] ?? $jwtUser['user_id'] ?? 0);
    }

    /**
     * Encode a payload into a JWT string. Returns null if secret is invalid.
     */
    public function encode(array $payload, ?int $expirySeconds = null): ?string
    {
        if (!$this->secretValid) {
            Log::error('JWT encode failed: JWT_SECRET is not configured or is too short (min 32 chars). Check .env.');
            return null;
        }

        try {
            $issuedAt = time();
            $expire = $issuedAt + ($expirySeconds ?? $this->ttl);

            $jwtPayload = array_merge([
                'iss' => config('app.url', 'http://localhost'),
                'aud' => config('app.url', 'http://localhost'),
                'iat' => $issuedAt,
                'exp' => $expire,
            ], $payload);

            return JWT::encode($jwtPayload, $this->secret, $this->algorithm);
        } catch (Exception $e) {
            Log::error('JWT encode exception', ['exception' => $e]);
            return null;
        }
    }

    /**
     * Decode a JWT string. Returns null if invalid or expired.
     */
    public function decode(string $token): ?array
    {
        if (!$this->secretValid) {
            Log::warning('JWT decode attempted while secret is invalid or unconfigured.');
            return null;
        }

        try {
            $decoded = JWT::decode($token, new Key($this->secret, $this->algorithm));
            return (array) $decoded;
        } catch (Exception $e) {
            Log::warning('JWT verification failed', [
                'exception' => $e,
                'token_snippet' => substr($token, 0, 15) . '...'
            ]);
            return null;
        }
    }
}
