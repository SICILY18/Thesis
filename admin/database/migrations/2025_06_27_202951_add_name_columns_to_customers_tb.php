<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('customers_tb', function (Blueprint $table) {
            // Add new name columns
            $table->string('first_name')->after('id');
            $table->string('last_name')->after('first_name');
            $table->string('full_name')->after('last_name');
            
            // Copy existing name data
            DB::statement("UPDATE customers_tb SET full_name = name, first_name = SUBSTRING_INDEX(name, ' ', 1), last_name = TRIM(SUBSTRING(name, LOCATE(' ', name)))");
            
            // Drop the old name column
            $table->dropColumn('name');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('customers_tb', function (Blueprint $table) {
            // Add back the name column
            $table->string('name')->after('id');
            
            // Copy data back
            DB::statement("UPDATE customers_tb SET name = full_name");
            
            // Drop the new columns
            $table->dropColumn(['first_name', 'last_name', 'full_name']);
        });
    }
};
