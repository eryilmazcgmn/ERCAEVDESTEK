<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AdminUserSeeder extends Seeder
{
    /**
     * Seed the initial admin user.
     * Idempotent: will not create duplicate admin if already exists (Rule 5).
     */
    public function run(): void
    {
        $adminUsername = 'admin';

        $existing = User::where('username', $adminUsername)->first();

        if ($existing) {
            Log::info('AdminUserSeeder: Admin user already exists, skipping.', ['id' => $existing->id]);
            $this->command->info('Admin user already exists. Skipping.');
            return;
        }

        // Default admin password — MUST be changed on first login in production
        $defaultPassword = env('ADMIN_DEFAULT_PASSWORD', 'ErcaAdmin2026!');

        $admin = User::create([
            'name' => 'ERCA Admin',
            'email' => 'admin@ercaevdestek.com',
            'username' => $adminUsername,
            'password' => Hash::make($defaultPassword),
            'role' => 'admin',
        ]);

        Log::info('AdminUserSeeder: Admin user created successfully.', ['id' => $admin->id]);
        $this->command->info("Admin user created. Username: {$adminUsername}");
    }
}
