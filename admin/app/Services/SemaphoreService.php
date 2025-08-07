<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SemaphoreService
{
    protected $apiKey;
    protected $apiUrl = 'https://api.semaphore.co/api/v4/messages';
    protected $senderName;

    public function __construct()
    {
        $this->apiKey = config('services.semaphore.api_key');
        $this->senderName = config('services.semaphore.sender_name', 'HWDIST');
        
        if (empty($this->apiKey)) {
            Log::error('Semaphore API key is not configured');
        }
    }

    /**
     * Send SMS using Semaphore
     *
     * @param string $number
     * @param string $message
     * @return array
     */
    public function sendSMS($number, $message)
    {
        try {
            // Log the request
            Log::info('Attempting to send SMS', [
                'number' => $number,
                'message' => $message,
                'api_key_configured' => !empty($this->apiKey),
                'sender_name' => $this->senderName
            ]);

            // Validate phone number format
            if (!preg_match('/^09\d{9}$/', $number)) {
                Log::error('Invalid phone number format', ['number' => $number]);
                return [
                    'success' => false,
                    'error' => 'Invalid phone number format. Must start with 09 and be 11 digits long.'
                ];
            }

            // Check if API key is configured
            if (empty($this->apiKey)) {
                Log::error('Semaphore API key is not configured');
                return [
                    'success' => false,
                    'error' => 'SMS service is not properly configured. Please check API key.'
                ];
            }

            // Make the API request
            $response = Http::post($this->apiUrl, [
                'apikey' => $this->apiKey,
                'number' => $number,
                'message' => $message,
            ]);

            // Log the response
            Log::info('Semaphore API Response', [
                'status' => $response->status(),
                'body' => $response->json(),
                'headers' => $response->headers()
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            } else {
                Log::error('Semaphore API Error', [
                    'status' => $response->status(),
                    'body' => $response->json(),
                    'headers' => $response->headers()
                ]);
                
                return [
                    'success' => false,
                    'error' => 'Failed to send SMS. Status: ' . $response->status(),
                    'details' => $response->json()
                ];
            }
        } catch (\Exception $e) {
            Log::error('Exception in sendSMS', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return [
                'success' => false,
                'error' => 'Failed to send SMS: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Send bulk SMS using Semaphore
     *
     * @param array $numbers
     * @param string $message
     * @return array
     */
    public function sendBulkSMS($numbers, $message)
    {
        try {
            // Log the bulk request
            Log::info('Attempting to send bulk SMS', [
                'number_count' => count($numbers),
                'message' => $message,
                'api_key_configured' => !empty($this->apiKey)
            ]);

            // Validate phone numbers
            $validNumbers = array_filter($numbers, function($number) {
                return preg_match('/^09\d{9}$/', $number);
            });

            if (empty($validNumbers)) {
                Log::error('No valid phone numbers provided for bulk SMS');
                return [
                    'success' => false,
                    'error' => 'No valid phone numbers provided'
                ];
            }

            // Check if API key is configured
            if (empty($this->apiKey)) {
                Log::error('Semaphore API key is not configured for bulk SMS');
                return [
                    'success' => false,
                    'error' => 'SMS service is not properly configured. Please check API key.'
                ];
            }

            $response = Http::post($this->apiUrl, [
                'apikey' => $this->apiKey,
                'number' => implode(',', $validNumbers),
                'message' => $message,
            ]);

            // Log the response
            Log::info('Semaphore Bulk API Response', [
                'status' => $response->status(),
                'body' => $response->json(),
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            } else {
                Log::error('Semaphore Bulk API Error', [
                    'status' => $response->status(),
                    'body' => $response->json(),
                ]);
                
                return [
                    'success' => false,
                    'error' => 'Failed to send bulk SMS. Status: ' . $response->status(),
                    'details' => $response->json()
                ];
            }
        } catch (\Exception $e) {
            Log::error('Exception in sendBulkSMS', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return [
                'success' => false,
                'error' => 'Failed to send bulk SMS: ' . $e->getMessage()
            ];
        }
    }
} 