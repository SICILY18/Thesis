<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create customers_tb table
        if (!Schema::hasTable('customers_tb')) {
            Schema::create('customers_tb', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('username')->unique();
                $table->string('password');
                $table->enum('customer_type', ['residential', 'commercial', 'government']);
                $table->string('address');
                $table->string('contact_number');
                $table->string('email')->unique();
                $table->string('account_number')->unique();
                $table->string('meter_number', 9)->unique();
                $table->timestamps();
            });
        }

        // Create tickets_tb table
        if (!Schema::hasTable('tickets_tb')) {
            Schema::create('tickets_tb', function (Blueprint $table) {
                $table->id('ticket_id');
                $table->unsignedBigInteger('customer_id');
                $table->string('subject');
                $table->text('description');
                $table->enum('status', ['Open', 'In_Progress', 'Resolved', 'Closed'])->default('Open');
                $table->enum('priority', ['Low', 'Medium', 'High', 'Urgent'])->default('Medium');
                $table->timestamps();
                
                $table->index(['customer_id', 'status']);
                $table->index('created_at');
            });
        }

        // Create ticket_remarks_history table
        if (!Schema::hasTable('ticket_remarks_history')) {
            Schema::create('ticket_remarks_history', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('ticket_id');
                $table->text('remarks');
                $table->timestamps();

                $table->index('ticket_id');
            });
        }

        // Add foreign key constraints
        if (Schema::hasTable('tickets_tb')) {
            Schema::table('tickets_tb', function (Blueprint $table) {
                $table->foreign('customer_id')
                    ->references('id')
                    ->on('customers_tb')
                    ->onDelete('cascade');
            });
        }

        if (Schema::hasTable('ticket_remarks_history')) {
            Schema::table('ticket_remarks_history', function (Blueprint $table) {
                $table->foreign('ticket_id')
                    ->references('ticket_id')
                    ->on('tickets_tb')
                    ->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket_remarks_history');
        Schema::dropIfExists('tickets_tb');
        Schema::dropIfExists('customers_tb');
    }
}; 