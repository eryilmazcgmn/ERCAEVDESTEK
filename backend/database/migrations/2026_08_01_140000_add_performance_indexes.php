<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add performance indexes to frequently queried foreign key columns.
 *
 * Note: Laravel's foreignId()->constrained() may already create indexes on some
 * database engines, but this migration ensures they exist explicitly across all
 * supported database drivers (MySQL, PostgreSQL, SQLite).
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // conversations.session_id already has a unique index from initial migration.

        // uploaded_files: frequently joined/filtered by conversation_id
        if (Schema::hasTable('uploaded_files') && Schema::hasColumn('uploaded_files', 'conversation_id')) {
            Schema::table('uploaded_files', function (Blueprint $table) {
                $table->index('conversation_id', 'uploaded_files_conversation_id_index');
            });
        }

        // quotations: frequently joined/filtered by conversation_id
        if (Schema::hasTable('quotations') && Schema::hasColumn('quotations', 'conversation_id')) {
            Schema::table('quotations', function (Blueprint $table) {
                $table->index('conversation_id', 'quotations_conversation_id_index');
            });
        }

        // work_orders: frequently joined/filtered by quotation_id
        if (Schema::hasTable('work_orders') && Schema::hasColumn('work_orders', 'quotation_id')) {
            Schema::table('work_orders', function (Blueprint $table) {
                $table->index('quotation_id', 'work_orders_quotation_id_index');
            });
        }

        // customers: phone is used for lookups and deduplication
        if (Schema::hasTable('customers') && Schema::hasColumn('customers', 'phone')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->index('phone', 'customers_phone_index');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('uploaded_files')) {
            Schema::table('uploaded_files', function (Blueprint $table) {
                $table->dropIndex('uploaded_files_conversation_id_index');
            });
        }

        if (Schema::hasTable('quotations')) {
            Schema::table('quotations', function (Blueprint $table) {
                $table->dropIndex('quotations_conversation_id_index');
            });
        }

        if (Schema::hasTable('work_orders')) {
            Schema::table('work_orders', function (Blueprint $table) {
                $table->dropIndex('work_orders_quotation_id_index');
            });
        }

        if (Schema::hasTable('customers')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->dropIndex('customers_phone_index');
            });
        }
    }
};
