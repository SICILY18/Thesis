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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->foreignId('bill_id')->constrained('bills')->onDelete('cascade');
            $table->decimal('amount', 10, 2);
            $table->enum('payment_type', ['Full', 'Partial']);
            $table->string('payment_method');
            $table->string('proof_of_payment');
            $table->string('account_number');
            $table->string('meter_number');
            $table->enum('status', ['Pending', 'Approved', 'Rejected', 'Verification_Failed'])->default('Pending');
            $table->decimal('remaining_balance', 10, 2)->default(0);
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            // Add indexes for faster verification
            $table->index(['account_number', 'meter_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
}; 