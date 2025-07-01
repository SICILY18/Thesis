<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    protected $table = 'tickets_tb';
    protected $primaryKey = 'ticket_id';

    protected $fillable = [
        'ticket_reference',
        'account_number',
        'customer_name',
        'customer_id',
        'category',
        'subcategory',
        'subject',
        'description',
        'status',
        'priority',
        'ticket_remarks',
        'admin_response',
        'image_url',
        'remarks_history',
        'admin_remarks'
    ];

    protected $casts = [
        'remarks_history' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Relationship with Customer model
    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    // Scope to filter tickets by status
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    // Scope to filter tickets by priority
    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    // Scope to filter tickets by category
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    // Get tickets created within a date range
    public function scopeCreatedBetween($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    // Get tickets updated within a date range
    public function scopeUpdatedBetween($query, $startDate, $endDate)
    {
        return $query->whereBetween('updated_at', [$startDate, $endDate]);
    }

    // Get tickets by account number
    public function scopeByAccountNumber($query, $accountNumber)
    {
        return $query->where('account_number', $accountNumber);
    }
} 