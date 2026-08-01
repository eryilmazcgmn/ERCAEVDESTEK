<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('service_prices')->insert([
            'service_type' => 'paint',
            'question_id' => 'spaceSizeM2',
            'option_value' => 'per_unit_price',
            'label' => 'Boyanacak Alan (m² Başına)',
            'price' => 80,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('service_prices')
            ->where('service_type', 'paint')
            ->where('question_id', 'spaceSizeM2')
            ->delete();
    }
};
