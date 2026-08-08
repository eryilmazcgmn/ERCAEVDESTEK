<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('service_prices', 'sort_order')) {
            Schema::table('service_prices', function (Blueprint $table) {
                $table->integer('sort_order')->default(0)->after('price');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('service_prices', 'sort_order')) {
            Schema::table('service_prices', function (Blueprint $table) {
                $table->dropColumn('sort_order');
            });
        }
    }
};
