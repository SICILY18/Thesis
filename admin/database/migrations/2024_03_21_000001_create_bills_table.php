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
        Schema::create('bills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->string('bill_number')->unique();
            $table->decimal('total_amount', 10, 2);
            $table->decimal('remaining_balance', 10, 2);
            $table->date('bill_date');
            $table->date('due_date');
            $table->decimal('previous_reading', 10, 2);
            $table->decimal('current_reading', 10, 2);
            $table->decimal('consumption', 10, 2);
            $table->decimal('rate_amount', 10, 2);
            $table->enum('status', ['Unpaid', 'Partially_Paid', 'Paid', 'Overdue'])->default('Unpaid');
            $table->timestamps();

            // Add indexes for better performance
            $table->index(['customer_id', 'status']);
            $table->index('bill_date');
            $table->index('due_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bills');
    }
}; 