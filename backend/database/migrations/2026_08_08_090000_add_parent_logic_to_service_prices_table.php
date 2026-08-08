<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('service_prices', 'parent_question_id')) {
            Schema::table('service_prices', function (Blueprint $table) {
                $table->string('parent_question_id')->nullable()->after('sort_order');
                $table->string('parent_option_value')->nullable()->after('parent_question_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('service_prices', 'parent_question_id')) {
            Schema::table('service_prices', function (Blueprint $table) {
                $table->dropColumn(['parent_question_id', 'parent_option_value']);
            });
        }
    }
};
