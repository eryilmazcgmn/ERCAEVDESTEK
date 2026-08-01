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
     * Ensure the JWT secret is valid before performing operations.
     *
     * @throws \RuntimeException if secret is not configured or too short
     */
    private function ensureSecretValid(): void
    {
        if (!$this->secretValid) {
            throw new \RuntimeException('JWT_SECRET must be configured with at least 32 characters in .env.');
        }
    }

    /**
     * Encode a payload into a JWT string.
     */
    public function encode(array $payload, ?int $expirySeconds = null): string
    {
        $this->ensureSecretValid();

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
        $this->ensureSecretValid();

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
