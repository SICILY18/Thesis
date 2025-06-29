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
        Schema::create('payment_history_tb', function (Blueprint $table) {
            $table->id();
            $table->string('account_number', 50);
            $table->string('full_name', 255);
            $table->decimal('amount_paid', 10, 2);
            $table->decimal('bill_amount', 10, 2)->nullable();
            $table->string('payment_method', 50);
            $table->string('payment_reference', 100);
            $table->string('bill_type', 50);
            $table->string('billing_period', 50);
            $table->datetime('due_date')->nullable();
            $table->enum('payment_status', ['pending_validation', 'processing', 'completed', 'rejected'])->default('pending_validation');
            $table->datetime('payment_date');
            $table->text('admin_notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_history_tb');
    }
}; 