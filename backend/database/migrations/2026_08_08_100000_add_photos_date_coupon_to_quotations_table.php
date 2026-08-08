<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('quotations', 'photos')) {
            Schema::table('quotations', function (Blueprint $table) {
                $table->json('photos')->nullable()->after('pdf_path');
                $table->date('preferred_date')->nullable()->after('photos');
                $table->string('time_slot')->nullable()->after('preferred_date');
                $table->string('coupon_code')->nullable()->after('time_slot');
                $table->decimal('discount_amount', 10, 2)->default(0)->after('coupon_code');
            });
        }

        if (!Schema::hasColumn('work_orders', 'photos')) {
            Schema::table('work_orders', function (Blueprint $table) {
                $table->json('photos')->nullable()->after('pdf_path');
                $table->date('preferred_date')->nullable()->after('photos');
                $table->string('time_slot')->nullable()->after('preferred_date');
                $table->string('coupon_code')->nullable()->after('time_slot');
                $table->decimal('discount_amount', 10, 2)->default(0)->after('coupon_code');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('quotations', 'photos')) {
            Schema::table('quotations', function (Blueprint $table) {
                $table->dropColumn(['photos', 'preferred_date', 'time_slot', 'coupon_code', 'discount_amount']);
            });
        }

        if (Schema::hasColumn('work_orders', 'photos')) {
            Schema::table('work_orders', function (Blueprint $table) {
                $table->dropColumn(['photos', 'preferred_date', 'time_slot', 'coupon_code', 'discount_amount']);
            });
        }
    }
};
