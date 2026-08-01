<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Quotation;
use App\Models\Customer;
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
        $this->assertEquals($user->id, JwtService::getUserId($decoded));
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

    public function test_admin_verify_token_endpoint(): void
    {
        $admin = User::factory()->create([
            'username' => 'adminuser',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);

        /** @var JwtService $jwtService */
        $jwtService = app(JwtService::class);
        $token = $jwtService->encode([
            'id' => $admin->id,
            'user_id' => $admin->id,
            'role' => 'admin',
            'username' => $admin->username,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/admin/verify-token');

        $response->assertStatus(200)
            ->assertJsonPath('status', true)
            ->assertJsonPath('message', 'Token geçerli.');
    }

    public function test_storage_stream_prevents_path_traversal(): void
    {
        $response = $this->getJson('/api/storage/../../.env');

        $response->assertStatus(404)
            ->assertJsonPath('status', false);
    }

    public function test_admin_quotations_default_pagination(): void
    {
        $admin = User::factory()->create(['username' => 'admin_user_' . rand(100, 999), 'role' => 'admin']);
        $customer = Customer::create(['name' => 'Test Customer', 'phone' => '05551112233', 'status' => 'lead']);
        Quotation::create([
            'customer_id' => $customer->id,
            'service_type' => 'kombi',
            'quotation_number' => 'TEK-' . rand(1000, 9999),
            'services' => ['kombi_bakimi'],
            'total_price' => 1500,
            'status' => 'pending',
        ]);

        /** @var JwtService $jwtService */
        $jwtService = app(JwtService::class);
        $token = $jwtService->encode([
            'id' => $admin->id,
            'user_id' => $admin->id,
            'role' => 'admin',
            'username' => $admin->username,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/admin/quotations');

        $response->assertStatus(200)
            ->assertJsonPath('status', true)
            ->assertJsonStructure(['data' => ['data', 'current_page', 'total']]);
    }
}
