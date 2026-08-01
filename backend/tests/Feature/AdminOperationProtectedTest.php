<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Services\Auth\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AdminOperationProtectedTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_run_migrations_requires_operation_key()
    {
        $user = User::factory()->create(['username' => 'admin', 'password' => bcrypt('password123'), 'role' => 'admin']);

        $jwtService = app(JwtService::class);
        $token = $jwtService->encode(['id' => $user->id, 'user_id' => $user->id, 'role' => 'admin']);

        // simulate ADMIN_OPERATION_SECRET set in env for test
        putenv('ADMIN_OPERATION_SECRET=test-op-key');

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/admin/run-migrations');

        $response->assertStatus(403);

        $response2 = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->withHeader('X-OPERATION-KEY', 'test-op-key')
            ->getJson('/api/admin/run-migrations');

        $response2->assertStatus(200);
    }
}
