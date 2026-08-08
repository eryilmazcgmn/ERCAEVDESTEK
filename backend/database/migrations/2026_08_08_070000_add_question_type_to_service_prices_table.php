<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('service_prices', 'question_type')) {
            Schema::table('service_prices', function (Blueprint $table) {
                $table->string('question_type')->default('radio')->after('question_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('service_prices', 'question_type')) {
            Schema::table('service_prices', function (Blueprint $table) {
                $table->dropColumn('question_type');
            });
        }
    }
};
