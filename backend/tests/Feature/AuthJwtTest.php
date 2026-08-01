<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Services\Auth\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AuthJwtTest extends TestCase
{
    use RefreshDatabase;

    public function test_jwt_encode_contains_both_id_and_user_id_claims(): void
    {
        $user = User::factory()->create([
            'username' => 'testuser',
            'password' => bcrypt('password123'),
            'role' => 'technician',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'username' => 'testuser',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', true)
            ->assertJsonStructure(['data' => ['token', 'user_id', 'role']]);

        $token = $response->json('data.token');
        
        /** @var JwtService $jwtService */
        $jwtService = app(JwtService::class);
        $decoded = $jwtService->decode($token);

        $this->assertNotNull($decoded);
        $this->assertEquals($user->id, $decoded['id'] ?? null);
        $this->assertEquals($user->id, $decoded['user_id'] ?? null);
        $this->assertEquals('technician', $decoded['role'] ?? null);
    }

    public function test_technician_can_fetch_work_orders_with_valid_jwt(): void
    {
        $user = User::factory()->create([
            'username' => 'technician1',
            'password' => bcrypt('password123'),
            'role' => 'technician',
        ]);

        /** @var JwtService $jwtService */
        $jwtService = app(JwtService::class);
        $token = $jwtService->encode([
            'id' => $user->id,
            'user_id' => $user->id,
            'role' => 'technician',
            'username' => $user->username,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/technician/work-orders');

        $response->assertStatus(200)
            ->assertJsonPath('status', true);
    }

    public function test_invalid_token_returns_401_unauthorized(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer invalid.token.string')
            ->getJson('/api/technician/work-orders');

        $response->assertStatus(401)
            ->assertJsonPath('status', false);
    }

    public function test_missing_token_returns_401_unauthorized(): void
    {
        $response = $this->getJson('/api/technician/work-orders');

        $response->assertStatus(401)
            ->assertJsonPath('status', false);
    }
}
