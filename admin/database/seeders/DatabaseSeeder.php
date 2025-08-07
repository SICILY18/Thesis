<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        // \App\Models\User::factory(10)->create();

        // \App\Models\User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);

        // Create the bill handler staff account
        DB::table('staff_tb')->insert([
            'name' => 'Bill Handler',
            'username' => 'Bill Handler',
            'password' => Hash::make('password'),  // You should change this to match the actual password
            'role' => 'bill handler',
            'address' => 'Hermosa Water District',
            'contact_number' => '+639090909091',
            'email' => 'billhandler@staff.com',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $this->call([
            AdminSeeder::class
        ]);
    }
}
