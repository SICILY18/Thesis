<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Insert billing cycle data
        $billingCycles = [
            [
                'id' => 1,
                'customer_id' => 1,
                'billing_start_date' => '2025-06-27 00:00:00',
                'billing_end_date' => '2025-07-27 00:00:00',
                'status' => 'active',
                'amount_due' => 44.00,
                'created_at' => '2025-07-02 09:37:18',
                'bill_status' => 'paid'
            ],
            [
                'id' => 2,
                'customer_id' => 3,
                'billing_start_date' => '2025-06-27 00:00:00',
                'billing_end_date' => '2025-07-27 00:00:00',
                'status' => 'active',
                'amount_due' => 0.00,
                'created_at' => '2025-07-02 09:37:19',
                'bill_status' => 'unpaid'
            ],
            [
                'id' => 3,
                'customer_id' => 4,
                'billing_start_date' => '2025-06-27 00:00:00',
                'billing_end_date' => '2025-07-27 00:00:00',
                'status' => 'active',
                'amount_due' => 0.00,
                'created_at' => '2025-07-02 09:37:19',
                'bill_status' => 'unpaid'
            ],
            [
                'id' => 4,
                'customer_id' => 210,
                'billing_start_date' => '2025-06-28 00:00:00',
                'billing_end_date' => '2025-07-28 00:00:00',
                'status' => 'active',
                'amount_due' => 14.00,
                'created_at' => '2025-07-02 09:37:20',
                'bill_status' => 'unpaid'
            ],
            [
                'id' => 5,
                'customer_id' => 211,
                'billing_start_date' => '2025-06-28 00:00:00',
                'billing_end_date' => '2025-07-28 00:00:00',
                'status' => 'active',
                'amount_due' => 0.00,
                'created_at' => '2025-07-02 09:37:20',
                'bill_status' => 'unpaid'
            ],
            [
                'id' => 6,
                'customer_id' => 212,
                'billing_start_date' => '2025-06-28 00:00:00',
                'billing_end_date' => '2025-07-28 00:00:00',
                'status' => 'active',
                'amount_due' => 0.00,
                'created_at' => '2025-07-02 09:37:20',
                'bill_status' => 'unpaid'
            ],
            [
                'id' => 7,
                'customer_id' => 213,
                'billing_start_date' => '2025-06-28 00:00:00',
                'billing_end_date' => '2025-07-28 00:00:00',
                'status' => 'active',
                'amount_due' => 0.00,
                'created_at' => '2025-07-02 09:37:21',
                'bill_status' => 'unpaid'
            ],
            [
                'id' => 8,
                'customer_id' => 214,
                'billing_start_date' => '2025-06-28 00:00:00',
                'billing_end_date' => '2025-07-28 00:00:00',
                'status' => 'active',
                'amount_due' => 0.00,
                'created_at' => '2025-07-02 09:37:21',
                'bill_status' => 'unpaid'
            ],
            [
                'id' => 9,
                'customer_id' => 215,
                'billing_start_date' => '2025-06-28 00:00:00',
                'billing_end_date' => '2025-07-28 00:00:00',
                'status' => 'active',
                'amount_due' => 0.00,
                'created_at' => '2025-07-02 09:37:22',
                'bill_status' => 'unpaid'
            ],
            [
                'id' => 10,
                'customer_id' => 216,
                'billing_start_date' => '2025-06-28 00:00:00',
                'billing_end_date' => '2025-07-28 00:00:00',
                'status' => 'active',
                'amount_due' => 136.00,
                'created_at' => '2025-07-02 09:37:22',
                'bill_status' => 'unpaid'
            ],
            [
                'id' => 11,
                'customer_id' => 217,
                'billing_start_date' => '2025-06-28 00:00:00',
                'billing_end_date' => '2025-07-28 00:00:00',
                'status' => 'active',
                'amount_due' => 0.00,
                'created_at' => '2025-07-02 09:37:23',
                'bill_status' => 'unpaid'
            ],
            [
                'id' => 12,
                'customer_id' => 218,
                'billing_start_date' => '2025-06-28 00:00:00',
                'billing_end_date' => '2025-07-28 00:00:00',
                'status' => 'active',
                'amount_due' => 0.00,
                'created_at' => '2025-07-02 09:37:23',
                'bill_status' => 'unpaid'
            ],
            [
                'id' => 13,
                'customer_id' => 219,
                'billing_start_date' => '2025-06-28 00:00:00',
                'billing_end_date' => '2025-07-28 00:00:00',
                'status' => 'active',
                'amount_due' => 0.00,
                'created_at' => '2025-07-02 09:37:24',
                'bill_status' => 'unpaid'
            ],
            [
                'id' => 14,
                'customer_id' => 220,
                'billing_start_date' => '2025-06-28 00:00:00',
                'billing_end_date' => '2025-07-28 00:00:00',
                'status' => 'active',
                'amount_due' => 0.00,
                'created_at' => '2025-07-02 09:37:24',
                'bill_status' => 'unpaid'
            ],
            [
                'id' => 15,
                'customer_id' => 221,
                'billing_start_date' => '2025-06-28 00:00:00',
                'billing_end_date' => '2025-07-28 00:00:00',
                'status' => 'active',
                'amount_due' => 0.00,
                'created_at' => '2025-07-02 09:37:24',
                'bill_status' => 'unpaid'
            ],
            [
                'id' => 16,
                'customer_id' => 2,
                'billing_start_date' => '2025-07-01 00:00:00',
                'billing_end_date' => '2025-08-01 00:00:00',
                'status' => 'active',
                'amount_due' => 0.00,
                'created_at' => '2025-07-02 09:37:25',
                'bill_status' => 'unpaid'
            ],
            [
                'id' => 17,
                'customer_id' => 209,
                'billing_start_date' => '2025-06-28 00:00:00',
                'billing_end_date' => '2025-07-28 00:00:00',
                'status' => 'active',
                'amount_due' => 0.00,
                'created_at' => '2025-07-02 09:37:25',
                'bill_status' => 'unpaid'
            ],
            [
                'id' => 18,
                'customer_id' => 1127,
                'billing_start_date' => '2025-06-28 00:00:00',
                'billing_end_date' => '2025-07-28 00:00:00',
                'status' => 'active',
                'amount_due' => 190.00,
                'created_at' => '2025-07-02 09:37:26',
                'bill_status' => 'completed'
            ],
            [
                'id' => 19,
                'customer_id' => 9174,
                'billing_start_date' => '2025-07-02 00:00:00',
                'billing_end_date' => '2025-07-06 00:00:00',
                'status' => 'active',
                'amount_due' => 104.00,
                'created_at' => '2025-07-02 10:07:00',
                'bill_status' => 'completed'
            ],
            [
                'id' => 20,
                'customer_id' => 9175,
                'billing_start_date' => '2025-07-02 00:00:00',
                'billing_end_date' => '2025-07-06 00:00:00',
                'status' => 'active',
                'amount_due' => 203.00,
                'created_at' => '2025-07-02 10:14:43',
                'bill_status' => 'unpaid'
            ],
            [
                'id' => 21,
                'customer_id' => 9176,
                'billing_start_date' => '2025-07-02 00:00:00',
                'billing_end_date' => '2025-07-06 00:00:00',
                'status' => 'active',
                'amount_due' => 905.00,
                'created_at' => '2025-07-02 10:15:52',
                'bill_status' => 'completed'
            ],
            [
                'id' => 22,
                'customer_id' => 9177,
                'billing_start_date' => '2025-07-02 00:00:00',
                'billing_end_date' => '2025-07-06 00:00:00',
                'status' => 'active',
                'amount_due' => 203.00,
                'created_at' => '2025-07-02 10:27:00',
                'bill_status' => 'unpaid'
            ],
            [
                'id' => 23,
                'customer_id' => 9178,
                'billing_start_date' => '2025-07-02 00:00:00',
                'billing_end_date' => '2025-07-06 00:00:00',
                'status' => 'active',
                'amount_due' => 0.00,
                'created_at' => '2025-07-02 11:22:57',
                'bill_status' => 'unpaid'
            ]
        ];

        foreach ($billingCycles as $cycle) {
            DB::table('billing_cycles_tb')->insert($cycle);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove the inserted billing cycles
        DB::table('billing_cycles_tb')->whereIn('id', range(1, 23))->delete();
    }
}; 