<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CheckTables extends Command
{
    protected $signature = 'check:tables';
    protected $description = 'Check which tables exist in the database';

    public function handle()
    {
        $tables = DB::select("
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        ");

        $this->info("Existing tables:");
        foreach ($tables as $table) {
            $this->line($table->table_name);
        }
    }
} 