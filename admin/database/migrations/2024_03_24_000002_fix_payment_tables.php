<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop the payments table if it exists
        Schema::dropIfExists('payments');

        // Create the payments table with the correct structure
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('bill_id');
            $table->string('payment_number')->unique();
            $table->decimal('amount', 10, 2);
            $table->enum('payment_type', ['Full', 'Partial']);
            $table->enum('payment_method', ['Cash', 'GCash', 'Bank_Transfer', 'Credit_Card', 'Other']);
            $table->string('proof_of_payment')->nullable();
            $table->string('account_number');
            $table->string('meter_number');
            $table->text('remarks')->nullable();
            $table->enum('status', ['Pending', 'Approved', 'Rejected', 'Verification_Failed'])->default('Pending');
            $table->decimal('remaining_balance', 10, 2)->default(0);
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->index(['customer_id', 'status']);
            $table->index(['account_number', 'meter_number']);
            $table->index('payment_number');
            $table->index('created_at');

            // Add foreign key constraints
            $table->foreign('customer_id')
                  ->references('id')
                  ->on('customers_tb')
                  ->onDelete('cascade');
                  
            $table->foreign('bill_id')
                  ->references('id')
                  ->on('bills')
                  ->onDelete('cascade');
                  
            $table->foreign('approved_by')
                  ->references('id')
                  ->on('users')
                  ->onDelete('set null');
        });

        // Delete the duplicate migration records
        DB::table('migrations')
            ->where('migration', 'like', '%create_payments_table%')
            ->delete();

        // Insert our migration record
        DB::table('migrations')->insert([
            'migration' => '2024_03_24_000002_fix_payment_tables',
            'batch' => DB::table('migrations')->max('batch') + 1
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
}; 