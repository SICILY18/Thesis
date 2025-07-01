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
        Schema::create('bill_payment_validation_tb', function (Blueprint $table) {
            $table->id();
            $table->string('customer', 255);
            $table->string('account_number', 50);
            $table->decimal('amount', 10, 2);
            $table->string('status', 20);
            $table->string('account_type', 50); // Commercial, Residential, or Government
            $table->string('period', 20);
            $table->string('payment_status')->default('pending_validation');
            $table->timestamp('payment_date')->nullable();
            $table->timestamp('validated_at')->nullable();
            $table->text('admin_notes')->nullable();
            $table->string('payment_method', 50)->nullable();
            $table->string('reference', 100)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bill_payment_validation_tb');
    }
}; 