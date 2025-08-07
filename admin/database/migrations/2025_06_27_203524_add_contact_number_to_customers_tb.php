<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

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
            if (!Schema::hasColumn('customers_tb', 'contact_number')) {
                $table->string('contact_number')->nullable();
            }
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
            if (Schema::hasColumn('customers_tb', 'contact_number')) {
                $table->dropColumn('contact_number');
            }
        });
    }
};
