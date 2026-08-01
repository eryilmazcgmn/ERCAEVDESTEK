<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Quotation;
use App\Models\Customer;
use App\Models\Conversation;
use App\Services\Auth\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class QuotationPaginationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_quotations_pagination()
    {
        $user = User::factory()->create(['username' => 'admin', 'password' => bcrypt('password123'), 'role' => 'admin']);
        $jwtService = app(JwtService::class);
        $token = $jwtService->encode(['id' => $user->id, 'user_id' => $user->id, 'role' => 'admin']);

        $customer = Customer::create(['name' => 'Test', 'phone' => '1234567890']);
        $conversation = Conversation::create(['customer_id' => $customer->id, 'session_id' => '123', 'status' => 'active']);
        for ($i = 0; $i < 15; $i++) {
            Quotation::create(['customer_id' => $customer->id, 'conversation_id' => $conversation->id, 'status' => 'pending', 'total_amount' => 100, 'service_type' => 'repair']);
        }

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/admin/quotations?per_page=10');

        $response->assertStatus(200);
        $response->assertJsonCount(10, 'data');
        $response->assertJsonStructure([
            'meta' => [
                'total',
                'current_page',
                'per_page',
                'last_page'
            ]
        ]);

        $responseDefault = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/admin/quotations');
        $responseDefault->assertStatus(200);
        $this->assertEquals(1, $responseDefault->json('meta.current_page'));
        $this->assertLessThanOrEqual(50, count($responseDefault->json('data')));
    }
}
