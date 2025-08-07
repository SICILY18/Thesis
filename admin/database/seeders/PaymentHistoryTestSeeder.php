<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class PaymentHistoryTestSeeder extends Seeder
{
    public function run()
    {
        $now = Carbon::now();
        $startOfWeek = $now->copy()->startOfWeek();
        $testPayments = [
            [
                'account_number' => '01-000001',
                'full_name' => 'Alice Completed',
                'amount_paid' => 1000,
                'bill_amount' => 1200,
                'payment_date' => $now,
                'due_date' => $now->copy()->addDays(10),
                'payment_status' => 'completed',
                'payment_method' => 'Cash',
                'payment_reference' => 'COMPLETE1',
                'billing_period' => $now->format('Y-m'),
                'bill_type' => 'residential',
            ],
            [
                'account_number' => '02-000002',
                'full_name' => 'Bob Pending',
                'amount_paid' => 500,
                'bill_amount' => 700,
                'payment_date' => $now,
                'due_date' => $now->copy()->addDays(5),
                'payment_status' => 'pending_validation',
                'payment_method' => 'Online',
                'payment_reference' => 'PENDING1',
                'billing_period' => $now->format('Y-m'),
                'bill_type' => 'commercial',
            ],
            [
                'account_number' => '03-000003',
                'full_name' => 'Charlie Failed',
                'amount_paid' => 0,
                'bill_amount' => 800,
                'payment_date' => $now,
                'due_date' => $now->copy()->addDays(7),
                'payment_status' => 'failed',
                'payment_method' => 'Cheque',
                'payment_reference' => 'FAILED1',
                'billing_period' => $now->format('Y-m'),
                'bill_type' => 'government',
            ],
            [
                'account_number' => '04-000004',
                'full_name' => 'Daisy Completed Week',
                'amount_paid' => 1500,
                'bill_amount' => 1500,
                'payment_date' => $startOfWeek->copy()->addDays(1),
                'due_date' => $startOfWeek->copy()->addDays(11),
                'payment_status' => 'completed',
                'payment_method' => 'Cash',
                'payment_reference' => 'COMPLETE2',
                'billing_period' => $now->format('Y-m'),
                'bill_type' => 'residential',
            ],
            [
                'account_number' => '05-000005',
                'full_name' => 'Eve Pending Month',
                'amount_paid' => 800,
                'bill_amount' => 900,
                'payment_date' => $now->copy()->subDays(10),
                'due_date' => $now->copy()->subDays(2),
                'payment_status' => 'pending_validation',
                'payment_method' => 'Online',
                'payment_reference' => 'PENDING2',
                'billing_period' => $now->format('Y-m'),
                'bill_type' => 'commercial',
            ],
        ];
        foreach ($testPayments as $payment) {
            DB::table('payment_history_tb')->insert($payment);
        }
    }
} 