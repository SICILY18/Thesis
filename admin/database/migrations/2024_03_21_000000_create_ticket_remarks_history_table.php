<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('ticket_remarks_history', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ticket_id');
            $table->text('remarks');
            $table->timestamps();

            // Add index for better performance
            $table->index('ticket_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('ticket_remarks_history');
    }
}; 