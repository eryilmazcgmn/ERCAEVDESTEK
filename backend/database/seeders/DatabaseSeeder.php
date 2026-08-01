<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Admin User',
            'username' => 'admin',
            'email' => 'admin@example.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
            'role' => 'admin',
        ]);

        User::factory()->create([
            'name' => 'Ahmet Usta',
            'username' => 'ahmetusta',
            'email' => 'ahmet@example.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
            'role' => 'technician',
        ]);
    }
}
