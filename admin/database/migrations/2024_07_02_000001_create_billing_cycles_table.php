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
        Schema::create('billing_cycles_tb', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers_tb');
            $table->timestamp('billing_start_date');
            $table->timestamp('billing_end_date');
            $table->string('status')->default('active');
            $table->decimal('amount_due', 10, 2)->default(0.00);
            $table->string('bill_status')->default('unpaid');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('billing_cycles_tb');
    }
}; 