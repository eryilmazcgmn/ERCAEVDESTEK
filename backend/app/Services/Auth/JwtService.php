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

    public function __construct()
    {
        $this->secret = config('services.jwt.secret', '');
        $this->algorithm = config('services.jwt.algorithm', 'HS256');
        $this->ttl = config('services.jwt.ttl', 86400);

        if (empty($this->secret) || strlen($this->secret) < 32) {
            Log::emergency('JWT_SECRET is not configured or is too short (min 32 chars). Check .env and config/services.php.');
            throw new \RuntimeException('JWT_SECRET must be configured with at least 32 characters in .env.');
        }
    }

    /**
     * Encode a payload into a JWT string.
     */
    public function encode(array $payload, ?int $expirySeconds = null): string
    {
        $issuedAt = time();
        $expire = $issuedAt + ($expirySeconds ?? $this->ttl);

        $jwtPayload = array_merge([
            'iss' => config('app.url', 'http://localhost'),
            'aud' => config('app.url', 'http://localhost'),
            'iat' => $issuedAt,
            'exp' => $expire,
        ], $payload);

        return JWT::encode($jwtPayload, $this->secret, $this->algorithm);
    }

    /**
     * Decode a JWT string. Returns null if invalid or expired.
     */
    public function decode(string $token): ?array
    {
        try {
            $decoded = JWT::decode($token, new Key($this->secret, $this->algorithm));
            return (array) $decoded;
        } catch (Exception $e) {
            Log::warning('JWT verification failed: ' . $e->getMessage(), [
                'token_snippet' => substr($token, 0, 15) . '...'
            ]);
            return null;
        }
    }
}
