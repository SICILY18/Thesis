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
        'reading_value' => 'decimal:2'
    ];

    protected $appends = [
        'billing_days',
        'previous_reading',
        'previous_reading_date',
        'consumption',
        'base_rate',
        'consumption_rate',
        'consumption_charge',
        'environmental_fee',
        'maintenance_fee',
        'previous_balance',
        'late_payment_charge',
        'subtotal',
        'discount',
        'total_amount'
    ];

    // Relationship with Customer
    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    // Relationship with Meter Reading
    public function meterReading()
    {
        return $this->belongsTo(MeterReading::class, 'reading_id');
    }

    // Get current meter reading
    public function getCurrentReadingAttribute()
    {
        return $this->meterReading ? $this->meterReading->reading_value : $this->reading_value;
    }

    // Get current reading date
    public function getCurrentReadingDateAttribute()
    {
        return $this->meterReading ? $this->meterReading->reading_date : $this->invoice_date;
    }

    // Get previous meter reading
    public function getPreviousReadingAttribute()
    {
        if (!$this->meterReading) {
            return 0;
        }

        $previousReading = MeterReading::where('meter_number', $this->meter_number)
            ->where('reading_date', '<', $this->meterReading->reading_date)
            ->orderBy('reading_date', 'desc')
            ->first();

        return $previousReading ? $previousReading->reading_value : 0;
    }

    // Get previous reading date
    public function getPreviousReadingDateAttribute()
    {
        if (!$this->meterReading) {
            return null;
        }

        $previousReading = MeterReading::where('meter_number', $this->meter_number)
            ->where('reading_date', '<', $this->meterReading->reading_date)
            ->orderBy('reading_date', 'desc')
            ->first();

        return $previousReading ? $previousReading->reading_date : null;
    }

    // Calculate billing days
    public function getBillingDaysAttribute()
    {
        $previousDate = $this->getPreviousReadingDateAttribute();
        $currentDate = $this->getCurrentReadingDateAttribute();

        if ($previousDate && $currentDate) {
            return $previousDate->diffInDays($currentDate);
        }
        return 30; // Default to 30 days if can't calculate
    }

    // Calculate consumption
    public function getConsumptionAttribute()
    {
        return $this->getCurrentReadingAttribute() - $this->getPreviousReadingAttribute();
    }

    // Get base rate (you might want to adjust this based on your rate structure)
    public function getBaseRateAttribute()
    {
        return 50.00; // Default base rate
    }

    // Get consumption rate (you might want to adjust this based on your rate structure)
    public function getConsumptionRateAttribute()
    {
        return 12.00; // Default rate per cubic meter
    }

    // Calculate consumption charge
    public function getConsumptionChargeAttribute()
    {
        return $this->getConsumptionAttribute() * $this->getConsumptionRateAttribute();
    }

    // Get environmental fee
    public function getEnvironmentalFeeAttribute()
    {
        return 0.00; // Default to 0
    }

    // Get maintenance fee
    public function getMaintenanceFeeAttribute()
    {
        return 0.00; // Default to 0
    }

    // Get previous balance
    public function getPreviousBalanceAttribute()
    {
        return Invoice::where('customer_id', $this->customer_id)
            ->where('invoice_id', '<', $this->invoice_id)
            ->where('status', 'Overdue')
            ->sum('amount');
    }

    // Calculate late payment charge
    public function getLatePaymentChargeAttribute()
    {
        return $this->getPreviousBalanceAttribute() > 0 ? 
            $this->getPreviousBalanceAttribute() * 0.02 : 0;
    }

    // Calculate subtotal
    public function getSubtotalAttribute()
    {
        return $this->getBaseRateAttribute() +
               $this->getConsumptionChargeAttribute() +
               $this->getEnvironmentalFeeAttribute() +
               $this->getMaintenanceFeeAttribute() +
               $this->getPreviousBalanceAttribute() +
               $this->getLatePaymentChargeAttribute();
    }

    // Calculate discount
    public function getDiscountAttribute()
    {
        // You might want to check customer type or other conditions for discount
        return 0.00;
    }

    // Get total amount
    public function getTotalAmountAttribute()
    {
        return $this->amount; // Use the existing amount field
    }

    // Get billing start date
    public function getBillingStartDateAttribute()
    {
        return $this->getPreviousReadingDateAttribute() ?? 
            $this->invoice_date->subDays(30);
    }

    // Get billing end date
    public function getBillingEndDateAttribute()
    {
        return $this->getCurrentReadingDateAttribute();
    }
} 