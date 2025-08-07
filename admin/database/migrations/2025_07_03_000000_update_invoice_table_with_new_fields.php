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
        Schema::table('invoice_tb', function (Blueprint $table) {
            // Remove old fields
            $table->dropColumn(['reading_value', 'amount']);

            // Add new fields
            $table->date('billing_start_date')->nullable();
            $table->date('billing_end_date')->nullable();
            $table->integer('billing_days')->nullable();
            $table->date('previous_reading_date')->nullable();
            $table->decimal('previous_reading', 10, 2)->nullable();
            $table->date('current_reading_date')->nullable();
            $table->decimal('current_reading', 10, 2)->nullable();
            $table->decimal('consumption', 10, 2)->nullable();
            $table->decimal('base_rate', 10, 2)->default(0);
            $table->decimal('consumption_rate', 10, 2)->default(0);
            $table->decimal('consumption_charge', 10, 2)->default(0);
            $table->decimal('environmental_fee', 10, 2)->default(0);
            $table->decimal('maintenance_fee', 10, 2)->default(0);
            $table->decimal('previous_balance', 10, 2)->default(0);
            $table->decimal('late_payment_charge', 10, 2)->default(0);
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2)->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoice_tb', function (Blueprint $table) {
            // Remove new fields
            $table->dropColumn([
                'billing_start_date',
                'billing_end_date',
                'billing_days',
                'previous_reading_date',
                'previous_reading',
                'current_reading_date',
                'current_reading',
                'consumption',
                'base_rate',
                'consumption_rate',
                'consumption_charge',
                'environmental_fee',
                'maintenance_fee',
                'previous_balance',
                'late_payment_charge',
                'subtotal',
                'discount',
                'total_amount'
            ]);

            // Restore old fields
            $table->decimal('reading_value', 10, 2)->nullable();
            $table->decimal('amount', 10, 2)->default(0);
        });
    }
}; 