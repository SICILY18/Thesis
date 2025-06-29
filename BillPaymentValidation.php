<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BillPaymentValidation extends Model
{
    use HasFactory;

    protected $table = 'payment_history_tb';

    protected $fillable = [
        'account_number',
        'full_name',
        'amount_paid',
        'bill_amount',
        'payment_method',
        'payment_reference',
        'bill_type',
        'billing_period',
        'due_date',
        'payment_status',
        'payment_date',
        'admin_notes',
    ];

    protected $casts = [
        'amount_paid' => 'decimal:2',
        'bill_amount' => 'decimal:2',
        'payment_date' => 'datetime',
        'due_date' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
} 