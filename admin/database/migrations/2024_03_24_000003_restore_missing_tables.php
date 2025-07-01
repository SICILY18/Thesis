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
        // Create customers_tb table if it doesn't exist
        if (!Schema::hasTable('customers_tb')) {
            Schema::create('customers_tb', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('username')->unique();
                $table->string('password');
                $table->enum('customer_type', ['residential', 'commercial', 'government']);
                $table->string('address');
                $table->string('contact_number');
                $table->string('email')->unique();
                $table->string('account_number')->unique();
                $table->string('meter_number', 9)->unique();
                $table->timestamps();
            });
        }

        // Create tickets_tb table if it doesn't exist
        if (!Schema::hasTable('tickets_tb')) {
            Schema::create('tickets_tb', function (Blueprint $table) {
                $table->id('ticket_id');
                $table->unsignedBigInteger('customer_id');
                $table->string('subject');
                $table->text('description');
                $table->enum('status', ['Open', 'In_Progress', 'Resolved', 'Closed'])->default('Open');
                $table->enum('priority', ['Low', 'Medium', 'High', 'Urgent'])->default('Medium');
                $table->timestamps();
                
                $table->index(['customer_id', 'status']);
                $table->index('created_at');
            });
        }

        // Create ticket_remarks_history table if it doesn't exist
        if (!Schema::hasTable('ticket_remarks_history')) {
            Schema::create('ticket_remarks_history', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('ticket_id');
                $table->text('remarks');
                $table->timestamps();

                $table->index('ticket_id');
            });
        }

        // Create rates_tb table if it doesn't exist
        if (!Schema::hasTable('rates_tb')) {
            Schema::create('rates_tb', function (Blueprint $table) {
                $table->id();
                $table->string('rate_name');
                $table->decimal('rate_amount', 10, 2);
                $table->enum('customer_type', ['residential', 'commercial', 'government']);
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index('customer_type');
                $table->index('is_active');
            });
        }

        // Create announcements_tb table if it doesn't exist
        if (!Schema::hasTable('announcements_tb')) {
            Schema::create('announcements_tb', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('content');
                $table->enum('status', ['Draft', 'Published', 'Archived'])->default('Draft');
                $table->timestamp('publish_date')->nullable();
                $table->timestamp('expiry_date')->nullable();
                $table->unsignedBigInteger('created_by');
                $table->timestamps();

                $table->index('status');
                $table->index(['publish_date', 'expiry_date']);
            });
        }

        // Add foreign key constraints only if both tables exist
        if (Schema::hasTable('tickets_tb') && Schema::hasTable('customers_tb')) {
            Schema::table('tickets_tb', function (Blueprint $table) {
                if (!$this->hasForeignKey('tickets_tb', 'tickets_tb_customer_id_foreign')) {
                    $table->foreign('customer_id')
                        ->references('id')
                        ->on('customers_tb')
                        ->onDelete('cascade');
                }
            });
        }

        if (Schema::hasTable('ticket_remarks_history') && Schema::hasTable('tickets_tb')) {
            Schema::table('ticket_remarks_history', function (Blueprint $table) {
                if (!$this->hasForeignKey('ticket_remarks_history', 'ticket_remarks_history_ticket_id_foreign')) {
                    $table->foreign('ticket_id')
                        ->references('ticket_id')
                        ->on('tickets_tb')
                        ->onDelete('cascade');
                }
            });
        }

        if (Schema::hasTable('announcements_tb') && Schema::hasTable('staff_tb')) {
            Schema::table('announcements_tb', function (Blueprint $table) {
                if (!$this->hasForeignKey('announcements_tb', 'announcements_tb_created_by_foreign')) {
                    $table->foreign('created_by')
                        ->references('id')
                        ->on('staff_tb')
                        ->onDelete('cascade');
                }
            });
        }
    }

    /**
     * Check if a foreign key constraint already exists
     */
    private function hasForeignKey($table, $foreignKey): bool
    {
        return Schema::getConnection()
            ->getDoctrineSchemaManager()
            ->listTableForeignKeys($table)
            ->contains($foreignKey);
    }

    /**
     * Reverse the migrations.
     * We won't implement this since we don't want to risk dropping tables
     */
    public function down(): void
    {
        // Intentionally left empty to prevent accidental table drops
    }
}; 