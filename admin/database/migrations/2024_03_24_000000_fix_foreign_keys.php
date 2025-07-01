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
        // Fix bills table foreign keys
        if (Schema::hasTable('bills')) {
            Schema::table('bills', function (Blueprint $table) {
                // Remove existing foreign key if it exists
                try {
                    $table->dropForeign(['customer_id']);
                } catch (\Exception $e) {}
                
                // Add the correct foreign key
                $table->foreign('customer_id')
                      ->references('id')
                      ->on('customers_tb')
                      ->onDelete('cascade');
            });
        }

        // Fix ticket_remarks_history table foreign keys
        if (Schema::hasTable('ticket_remarks_history')) {
            Schema::table('ticket_remarks_history', function (Blueprint $table) {
                // Remove existing foreign key if it exists
                try {
                    $table->dropForeign(['ticket_id']);
                } catch (\Exception $e) {}
                
                // Add the correct foreign key
                $table->foreign('ticket_id')
                      ->references('ticket_id')
                      ->on('tickets_tb')
                      ->onDelete('cascade');
            });
        }

        // Fix payments table foreign keys
        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                // Remove existing foreign keys if they exist
                try {
                    $table->dropForeign(['customer_id']);
                    $table->dropForeign(['bill_id']);
                    $table->dropForeign(['approved_by']);
                } catch (\Exception $e) {}
                
                // Add the correct foreign keys
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
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove foreign keys from bills table
        if (Schema::hasTable('bills')) {
            Schema::table('bills', function (Blueprint $table) {
                try {
                    $table->dropForeign(['customer_id']);
                } catch (\Exception $e) {}
            });
        }

        // Remove foreign keys from ticket_remarks_history table
        if (Schema::hasTable('ticket_remarks_history')) {
            Schema::table('ticket_remarks_history', function (Blueprint $table) {
                try {
                    $table->dropForeign(['ticket_id']);
                } catch (\Exception $e) {}
            });
        }

        // Remove foreign keys from payments table
        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                try {
                    $table->dropForeign(['customer_id']);
                    $table->dropForeign(['bill_id']);
                    $table->dropForeign(['approved_by']);
                } catch (\Exception $e) {}
            });
        }
    }
}; 