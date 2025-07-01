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
        Schema::table('bills', function (Blueprint $table) {
            // Drop the existing foreign key if it exists
            $table->dropForeign(['customer_id']);
            
            // Add the foreign key constraint now that both tables exist
            $table->foreign('customer_id')
                  ->references('id')
                  ->on('customers_tb')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
        });
    }
}; 