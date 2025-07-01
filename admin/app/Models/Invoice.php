<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $table = 'invoice_tb';
    protected $primaryKey = 'invoice_id';

    protected $fillable = [
        'customer_id',
        'reading_id',
        'invoice_date',
        'due_date',
        'reading_value',
        'meter_number',
        'amount',
        'status',
        'sent_via',
        'pdf_url',
        'notes'
    ];

    protected $casts = [
        'invoice_date' => 'date',
        'due_date' => 'date',
        'amount' => 'decimal:2',
        'reading_value' => 'decimal:2',
    ];

    // Relationship with Customer
    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    // Relationship with Meter Reading (assuming you have this model)
    public function meterReading()
    {
        return $this->belongsTo(MeterReading::class, 'reading_id');
    }
} 