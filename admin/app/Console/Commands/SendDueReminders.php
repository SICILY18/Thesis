<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\SemaphoreService;
use Carbon\Carbon;

class SendDueReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * --days: number of days before due date to send the reminder (default: 5)
     * --dry-run: log the list without sending SMS
     *
     * @var string
     */
    protected $signature = 'sms:send-due-reminders {--from=1} {--to=5} {--dry-run}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send SMS reminders to customers N days before billing due date (default 5 days).';

    private SemaphoreService $smsService;

    public function __construct(SemaphoreService $smsService)
    {
        parent::__construct();
        $this->smsService = $smsService;
    }

    public function handle(): int
    {
        $fromDays = max(0, (int) $this->option('from'));
        $toDays = max($fromDays, (int) $this->option('to'));
        $dryRun = (bool) $this->option('dry-run');
        $startDate = Carbon::now()->addDays($fromDays)->toDateString();
        $endDate = Carbon::now()->addDays($toDays)->toDateString();

        $this->info("Looking for unpaid bills due between {$startDate} (in {$fromDays} days) and {$endDate} (in {$toDays} days)...");

        try {
            $customers = DB::table('billing_cycles_tb')
                ->join('customers_tb', 'billing_cycles_tb.customer_id', '=', 'customers_tb.id')
                ->select([
                    'customers_tb.id',
                    'customers_tb.full_name as name',
                    'customers_tb.account_number',
                    'customers_tb.phone_number',
                    'billing_cycles_tb.amount_due as amount',
                    'billing_cycles_tb.billing_start_date',
                    'billing_cycles_tb.billing_end_date as due_date',
                    'billing_cycles_tb.bill_status as status',
                    DB::raw("billing_cycles_tb.billing_start_date::date as start_date"),
                    DB::raw("billing_cycles_tb.billing_end_date::date as end_date"),
                ])
                ->where('billing_cycles_tb.bill_status', '=', 'unpaid')
                ->whereNotNull('customers_tb.phone_number')
                ->whereRaw("billing_cycles_tb.billing_end_date::date between ? and ?", [$startDate, $endDate])
                ->orderBy('customers_tb.account_number', 'asc')
                ->get();

            if ($customers->isEmpty()) {
                $this->info('No customers found with unpaid bills for that date.');
                return 0;
            }

            $template = "Dear valued customer,\n\nThis is a reminder that your water bill for {billing_period} amounting to ₱{amount} is due on {due_date}. Please settle your bill to avoid any service interruption.\n\nThank you,\nHermosa Water District";

            $sent = 0;
            $failed = 0;
            $skipped = 0;

            foreach ($customers as $c) {
                $number = $c->phone_number;
                if (!preg_match('/^09\d{9}$/', $number)) {
                    $skipped++;
                    Log::warning('Skipping invalid phone number for reminder', ['number' => $number, 'account' => $c->account_number]);
                    continue;
                }

                $billingPeriod = Carbon::parse($c->billing_start_date)->format('F j, Y') . ' - ' . Carbon::parse($c->due_date)->format('F j, Y');
                $message = str_replace(
                    ['{billing_period}', '{amount}', '{due_date}'],
                    [
                        $billingPeriod,
                        number_format((float)$c->amount, 2),
                        Carbon::parse($c->due_date)->format('F j, Y')
                    ],
                    $template
                );

                if ($dryRun) {
                    $this->line("[DRY-RUN] Would send to {$number} ({$c->account_number})");
                    $sent++;
                    continue;
                }

                $result = $this->smsService->sendSMS($number, $message);
                if (!empty($result['success'])) {
                    $sent++;
                } else {
                    $failed++;
                    Log::error('Failed sending reminder', [
                        'number' => $number,
                        'account' => $c->account_number,
                        'error' => $result['error'] ?? 'unknown'
                    ]);
                }
            }

            $this->info("Reminders complete. Sent: {$sent}, Failed: {$failed}, Skipped: {$skipped}");
            return 0;
        } catch (\Throwable $e) {
            Log::error('Error sending due reminders', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            $this->error('Error sending reminders: ' . $e->getMessage());
            return 1;
        }
    }
}


