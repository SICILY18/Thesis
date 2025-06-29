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
        Schema::create('tickets_tb', function (Blueprint $table) {
            $table->id('ticket_id');
            $table->string('ticket_reference')->unique();
            $table->string('account_number');
            $table->string('customer_name');
            $table->string('category');
            $table->string('subcategory');
            $table->text('description');
            $table->string('image_path')->nullable();
            $table->string('status')->default('Open');
            $table->string('priority')->default('Medium');
            $table->text('ticket_remarks')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tickets_tb');
    }
}; 