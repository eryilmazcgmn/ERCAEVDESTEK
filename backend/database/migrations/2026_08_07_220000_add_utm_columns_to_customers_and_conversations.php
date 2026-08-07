<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds missing columns that the application code references but the original
     * migrations did not create: UTM tracking on customers/conversations,
     * and completion/address fields on work_orders.
     */
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('utm_source')->nullable()->after('status');
            $table->string('utm_medium')->nullable()->after('utm_source');
            $table->string('utm_campaign')->nullable()->after('utm_medium');
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->string('utm_source')->nullable()->after('status');
            $table->string('utm_medium')->nullable()->after('utm_source');
            $table->string('utm_campaign')->nullable()->after('utm_medium');
        });

        Schema::table('work_orders', function (Blueprint $table) {
            $table->text('completion_notes')->nullable()->after('pdf_path');
            $table->string('completion_photo')->nullable()->after('completion_notes');
            $table->string('customer_address')->nullable()->after('completion_photo');
            $table->string('customer_phone')->nullable()->after('customer_address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['utm_source', 'utm_medium', 'utm_campaign']);
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->dropColumn(['utm_source', 'utm_medium', 'utm_campaign']);
        });

        Schema::table('work_orders', function (Blueprint $table) {
            $table->dropColumn(['completion_notes', 'completion_photo', 'customer_address', 'customer_phone']);
        });
    }
};
