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
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('bill_id');
            $table->decimal('amount', 10, 2);
            $table->enum('payment_type', ['Full', 'Partial']);
            $table->string('payment_method');
            $table->string('proof_of_payment');
            $table->enum('status', ['Pending', 'Verification_Failed', 'Approved', 'Rejected'])
                  ->default('Pending');
            $table->decimal('remaining_balance', 10, 2)->default(0);
            $table->string('account_number');
            $table->string('meter_number');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            // Add indexes for better performance
            $table->index(['user_id', 'customer_id', 'bill_id']);
            $table->index('status');
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