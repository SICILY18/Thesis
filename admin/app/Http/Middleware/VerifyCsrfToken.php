<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;
use Illuminate\Support\Facades\Log;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        '*'  // This will exclude all routes from CSRF protection
    ];

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     *
     * @throws \Illuminate\Session\TokenMismatchException
     */
    protected function tokensMatch($request)
    {
        $tokensMatch = parent::tokensMatch($request);
        
        if (!$tokensMatch) {
            Log::warning('CSRF Token Mismatch', [
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'token_from_header' => $request->header('X-CSRF-TOKEN'),
                'token_from_input' => $request->input('_token'),
                'session_token' => $request->session()->token(),
                'user_id' => $request->user()?->id,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'referrer' => $request->header('referer'),
                'cookies' => $request->cookies->all()
            ]);
        }

        return $tokensMatch;
    }
}
