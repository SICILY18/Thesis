<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        'api/bill-payment-validation/*/status',
        'api/bill-payment-validation/*/validate',
        'api/admin-login',
        'api/admin-logout',
        'api/admin/profile/update',
        'api/announcements',
        'api/announcements/*',
        'api/accounts',
        'api/accounts/*',
        'api/payments',
        'api/payments/*',
        'api/tickets',
        'api/tickets/*',
        'api/rates',
        'api/rates/*',
        'api/invoices/*',
        'api/invoices/generate',
        'api/generate-invoice'
    ];
}
