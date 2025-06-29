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
        Schema::create('announcements_tb', function (Blueprint $table) {
            $table->id();
            $table->string('title', 100);
            $table->text('body');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->unsignedBigInteger('staff_id');
            $table->string('posted_by'); // This will store the name for display purposes
            $table->foreign('staff_id')
                  ->references('id')
                  ->on('staff_tb')
                  ->onUpdate('cascade')
                  ->onDelete('cascade');
            $table->dateTime('published_at');
            $table->dateTime('expired_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('announcements_tb');
    }
};
