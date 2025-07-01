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
        Schema::table('ticket_remarks_history', function (Blueprint $table) {
            // Add the foreign key constraint now that both tables exist
            $table->foreign('ticket_id')
                  ->references('ticket_id')
                  ->on('tickets_tb')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ticket_remarks_history', function (Blueprint $table) {
            $table->dropForeign(['ticket_id']);
        });
    }
}; 