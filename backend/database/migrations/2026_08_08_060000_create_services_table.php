<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('icon')->default('Wrench');        // lucide icon name
            $table->string('color')->default('text-primary-400'); // tailwind text color class
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->integer('min_price')->default(0);         // starting price for display
            $table->timestamps();
        });

        // Seed default services
        DB::table('services')->insert([
            [
                'slug' => 'tv-mount',
                'name' => 'TV Montajı & Askı',
                'description' => 'Duvara profesyonel TV montajı',
                'icon' => 'Wrench',
                'color' => 'text-primary-400',
                'sort_order' => 1,
                'is_active' => true,
                'min_price' => 750,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'slug' => 'paint',
                'name' => 'Boyama & Dekorasyon',
                'description' => 'İç cephe boya ve badana',
                'icon' => 'FlameKindling',
                'color' => 'text-yellow-400',
                'sort_order' => 2,
                'is_active' => true,
                'min_price' => 1500,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'slug' => 'plumbing',
                'name' => 'Sıhhi Tesisat',
                'description' => 'Su tesisatı ve onarım',
                'icon' => 'Droplet',
                'color' => 'text-blue-400',
                'sort_order' => 3,
                'is_active' => true,
                'min_price' => 600,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'slug' => 'electric',
                'name' => 'Elektrik İşleri',
                'description' => 'Elektrik arıza ve montaj',
                'icon' => 'Zap',
                'color' => 'text-red-400',
                'sort_order' => 4,
                'is_active' => true,
                'min_price' => 400,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
