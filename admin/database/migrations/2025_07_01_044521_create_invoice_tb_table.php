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
        Schema::create('invoice_tb', function (Blueprint $table) {
            $table->id('invoice_id');
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('reading_id');
            $table->date('invoice_date');
            $table->date('due_date');
            $table->decimal('reading_value', 10, 2);
            $table->string('meter_number', 50);
            $table->decimal('amount', 10, 2);
            $table->enum('status', ['Pending', 'Sent', 'Paid', 'Overdue', 'Cancelled'])->default('Pending');
            $table->string('sent_via', 20)->nullable();
            $table->text('pdf_url')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            // Add foreign key constraints
            $table->foreign('customer_id')->references('id')->on('customers_tb')->onDelete('cascade');
            $table->foreign('reading_id')->references('id')->on('meter_readings')->onDelete('cascade');
            
            // Add indexes for better performance
            $table->index(['customer_id', 'invoice_date']);
            $table->index('status');
            $table->index('meter_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice_tb');
    }
};
