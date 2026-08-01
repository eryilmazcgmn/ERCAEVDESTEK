<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Customers Table
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone');
            $table->text('address')->nullable();
            $table->string('status')->default('lead'); // lead, active, archived
            $table->timestamps();
        });

        // 2. Conversations Table
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->string('session_id')->unique();
            $table->string('status')->default('active'); // active, completed
            $table->timestamps();
        });

        // 3. Quotations Table
        Schema::create('quotations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->foreignId('conversation_id')->nullable()->constrained('conversations')->nullOnDelete();
            $table->string('service_type'); // tv-mount, paint, etc.
            $table->json('details')->nullable(); // answers to dynamic questions
            $table->json('price_details')->nullable(); // breakdown of pricing
            $table->string('pdf_path')->nullable();
            $table->string('status')->default('pending'); // pending, approved, rejected
            $table->timestamps();
        });

        // 4. Work Orders Table
        Schema::create('work_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_id')->constrained('quotations')->onDelete('cascade');
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->dateTime('scheduled_at')->nullable();
            $table->string('technician_name')->nullable();
            $table->string('status')->default('pending'); // pending, scheduled, in_progress, completed, cancelled
            $table->string('pdf_path')->nullable();
            $table->timestamps();
        });

        // 5. Uploaded Files Table (Photos & Documents)
        Schema::create('uploaded_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->foreignId('conversation_id')->nullable()->constrained('conversations')->nullOnDelete();
            $table->string('file_path');
            $table->string('file_type'); // image, document
            $table->string('mime_type');
            $table->integer('file_size');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('uploaded_files');
        Schema::dropIfExists('work_orders');
        Schema::dropIfExists('quotations');
        Schema::dropIfExists('conversations');
        Schema::dropIfExists('customers');
    }
};
