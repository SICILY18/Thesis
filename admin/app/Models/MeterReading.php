<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MeterReading extends Model
{
    use HasFactory;

    protected $table = 'meter_readings';

    protected $fillable = [
        'meter_number',
        'reading_value',
        'amount',
        'remarks',
        'staff_id',
        'reading_date'
    ];

    protected $casts = [
        'reading_date' => 'datetime',
        'reading_value' => 'decimal:2',
        'amount' => 'decimal:2',
    ];

    // Relationship with Staff
    public function staff()
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }

    // Relationship with Invoices
    public function invoices()
    {
        return $this->hasMany(Invoice::class, 'reading_id');
    }
} 