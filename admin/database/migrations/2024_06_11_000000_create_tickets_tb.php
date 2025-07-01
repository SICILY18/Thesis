<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('tickets_tb', function (Blueprint $table) {
            $table->id('ticket_id');
            $table->string('ticket_reference')->unique();
            $table->string('account_number');
            $table->string('category');
            $table->string('subcategory');
            $table->string('subject');
            $table->text('description');
            $table->enum('status', ['open', 'pending', 'resolved', 'closed'])->default('open');
            $table->enum('priority', ['Low', 'Medium', 'High'])->default('Medium');
            $table->text('ticket_remarks')->nullable();
            $table->string('image_url')->nullable();
            $table->json('remarks_history')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('tickets_tb');
    }
}; 