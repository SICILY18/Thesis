<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FixMigrationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the current max batch number
        $maxBatch = DB::table('migrations')->max('batch');

        // Mark problematic migrations as completed
        $migrations = [
            '2024_03_21_000001_create_payments_table',
            '2024_03_21_000002_create_payments_table'
        ];

        foreach ($migrations as $migration) {
            if (!DB::table('migrations')->where('migration', $migration)->exists()) {
                DB::table('migrations')->insert([
                    'migration' => $migration,
                    'batch' => $maxBatch + 1
                ]);
            }
        }
    }
} 