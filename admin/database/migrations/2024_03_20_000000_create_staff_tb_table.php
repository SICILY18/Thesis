<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('staff_tb', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('username')->unique();
            $table->string('password');
            $table->enum('role', ['admin', 'bill handler', 'meter handler']);
            $table->string('address');
            $table->string('contact_number');
            $table->string('email');
            $table->timestamps();
        });

        // Insert superadmin account
        DB::table('staff_tb')->insert([
            [
                'name' => 'Hermosa Admin',
                'username' => 'superadmin',
                'password' => Hash::make('superadmin123!'),
                'role' => 'admin',
                'address' => 'Hermosa Water District',
                'contact_number' => '+639090909090',
                'email' => 'hermosa@admin.com',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_tb');
    }
}; 