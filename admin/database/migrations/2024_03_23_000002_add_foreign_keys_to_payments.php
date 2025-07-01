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
        Schema::table('payments', function (Blueprint $table) {
            // Add foreign key constraints now that all tables exist
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade');
                  
            $table->foreign('customer_id')
                  ->references('id')
                  ->on('customers_tb')
                  ->onDelete('cascade');
                  
            $table->foreign('bill_id')
                  ->references('id')
                  ->on('bills')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['customer_id']);
            $table->dropForeign(['bill_id']);
        });
    }
}; 