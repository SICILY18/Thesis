<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('tickets_tb', function (Blueprint $table) {
            $table->json('remarks_history')->nullable()->after('ticket_remarks');
        });
    }

    public function down()
    {
        Schema::table('tickets_tb', function (Blueprint $table) {
            $table->dropColumn('remarks_history');
        });
    }
}; 