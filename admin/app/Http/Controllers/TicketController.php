<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Services\SupabaseService;

class TicketController extends Controller
{
    protected $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    public function index()
    {
        try {
            // First get the tickets
            $result = $this->supabase->query('tickets_tb', '*', [
                'select' => '*',
                'order' => [
                    'created_at' => 'desc'
                ]
            ]);

            if (!$result['success']) {
                throw new \Exception($result['error'] ?? 'Failed to fetch tickets');
            }

            $tickets = $result['data'];
            
            // Get unique account numbers
            $accountNumbers = array_unique(array_filter(array_column($tickets, 'account_number')));
            
            // Fetch customer data if we have account numbers
            $customerData = [];
            if (!empty($accountNumbers)) {
                $customersResult = $this->supabase->query('customers_tb', '*', [
                    'select' => 'account_number, name',
                    'filter' => [
                        'account_number' => ['in', implode(',', $accountNumbers)]
                    ]
                ]);
                
                if ($customersResult['success'] && !empty($customersResult['data'])) {
                    foreach ($customersResult['data'] as $customer) {
                        $customerData[$customer['account_number']] = $customer;
                    }
                }
            }

            // Map tickets with customer data
            $formattedTickets = array_map(function ($ticket) use ($customerData) {
                $customer = isset($ticket['account_number']) ? ($customerData[$ticket['account_number']] ?? null) : null;
                return [
                    'ticket_id' => $ticket['ticket_id'],
                    'subject' => $ticket['subject'],
                    'status' => $ticket['status'],
                    'created_at' => $ticket['created_at'],
                    'updated_at' => $ticket['updated_at'],
                    'remarks' => $ticket['ticket_remarks'],
                    'remarksHistory' => is_string($ticket['remarks_history']) 
                        ? json_decode($ticket['remarks_history'], true) 
                        : ($ticket['remarks_history'] ?? []),
                    'description' => $ticket['description'],
                    'category' => $ticket['category'],
                    'subcategory' => $ticket['subcategory'],
                    'priority' => $ticket['priority'],
                    'ticket_reference' => $ticket['ticket_reference'],
                    'customer_name' => $customer ? $customer['name'] : 'Account Number',
                    'account_number' => $ticket['account_number'] ?? '-'
                ];
            }, $tickets);

            return response()->json([
                'success' => true,
                'data' => $formattedTickets
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching tickets: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching tickets: ' . $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'account_number' => 'required|string',
            'category' => 'required|string|in:Technical,Non-Technical',
            'subcategory' => 'required|string',
            'description' => 'required|string',
            'image' => 'nullable|image|max:2048'
        ]);

        try {
            $imageUrl = null;
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $imagePath = $image->store('ticket-images', 'public');
                $imageUrl = url(Storage::url($imagePath));
            }

            $ticketReference = $this->generateTicketReference();
            $subject = $request->category . ' - ' . $request->subcategory;
            $remarksHistory = json_encode([]);

            $ticketData = [
                'ticket_reference' => $ticketReference,
                'account_number' => $request->account_number,
                'category' => $request->category,
                'subcategory' => $request->subcategory,
                'subject' => $subject,
                'description' => $request->description,
                'status' => 'Open',
                'priority' => 'Medium',
                'ticket_remarks' => '',
                'image_url' => $imageUrl,
                'remarks_history' => $remarksHistory,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            $result = $this->supabase->insert('tickets_tb', $ticketData);

            if (!$result['success']) {
                throw new \Exception($result['error'] ?? 'Failed to create ticket');
            }

            return response()->json([
                'success' => true,
                'message' => 'Ticket created successfully',
                'data' => [
                    'ticket_reference' => $ticketReference
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error creating ticket: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error creating ticket: ' . $e->getMessage()
            ], 500);
        }
    }

    public function addRemarks(Request $request, $id)
    {
        $request->validate([
            'remarks' => 'required|string'
        ]);

        try {
            Log::info('Adding remarks for ticket ID: ' . $id);
            
            // Get ticket by ticket_id
            $result = $this->supabase->query('tickets_tb', '*', [
                'select' => '*',
                'filter' => [
                    'ticket_id' => ['eq', $id]
                ]
            ]);
            
            if (!$result['success'] || empty($result['data'])) {
                Log::error('Ticket not found with ID: ' . $id);
                return response()->json([
                    'success' => false,
                    'message' => 'Ticket not found'
                ], 404);
            }

            $ticket = $result['data'][0];
            Log::info('Found ticket:', ['ticket' => $ticket]);

            // Handle remarks history - ensure it's an array
            $remarksHistory = [];
            if (!empty($ticket['remarks_history'])) {
                if (is_string($ticket['remarks_history'])) {
                    $remarksHistory = json_decode($ticket['remarks_history'], true) ?? [];
                } else if (is_array($ticket['remarks_history'])) {
                    $remarksHistory = $ticket['remarks_history'];
                }
            }

            // Add new remark
            $remarksHistory[] = [
                'status' => $ticket['status'] ?? 'Open',
                'remarks' => $request->remarks,
                'timestamp' => now()->toIso8601String(),
                'user' => auth()->user()->name ?? 'Admin User'
            ];

            $updateData = [
                'ticket_remarks' => $request->remarks,
                'remarks_history' => json_encode($remarksHistory),
                'updated_at' => now()
            ];

            $updateResult = $this->supabase->update('tickets_tb', $updateData, [
                'ticket_id' => ['eq', $id]
            ]);

            if (!$updateResult['success']) {
                throw new \Exception($updateResult['error'] ?? 'Failed to update ticket');
            }

            // Get the updated ticket
            $updatedResult = $this->supabase->query('tickets_tb', '*', [
                'select' => '*',
                'filter' => [
                    'ticket_id' => ['eq', $id]
                ]
            ]);

            if (!$updatedResult['success'] || empty($updatedResult['data'])) {
                throw new \Exception('Failed to fetch updated ticket');
            }

            $updatedTicket = $updatedResult['data'][0];

            return response()->json([
                'success' => true,
                'message' => 'Remarks added successfully',
                'data' => [
                    'ticket_id' => $updatedTicket['ticket_id'],
                    'subject' => $updatedTicket['subject'],
                    'status' => $updatedTicket['status'],
                    'created_at' => $updatedTicket['created_at'],
                    'updated_at' => $updatedTicket['updated_at'],
                    'remarks' => $updatedTicket['ticket_remarks'],
                    'remarksHistory' => json_decode($updatedTicket['remarks_history'], true),
                    'description' => $updatedTicket['description'],
                    'category' => $updatedTicket['category'],
                    'subcategory' => $updatedTicket['subcategory'],
                    'priority' => $updatedTicket['priority'],
                    'ticket_reference' => $updatedTicket['ticket_reference'],
                    'account_number' => $updatedTicket['account_number'] ?? '-'
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error adding remarks: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error adding remarks: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string|in:Open,In Progress,Resolved',
            'remarks' => 'required|string'
        ]);

        try {
            Log::info('Updating ticket ID: ' . $id);
            
            // Get ticket by ticket_id
            $result = $this->supabase->query('tickets_tb', '*', [
                'select' => '*',
                'filter' => [
                    'ticket_id' => ['eq', $id]
                ]
            ]);
            
            if (!$result['success'] || empty($result['data'])) {
                Log::error('Ticket not found with ID: ' . $id);
                return response()->json([
                    'success' => false,
                    'message' => 'Ticket not found'
                ], 404);
            }

            $ticket = $result['data'][0];
            Log::info('Found ticket:', ['ticket' => $ticket]);

            // Handle remarks history
            $remarksHistory = [];
            if (!empty($ticket['remarks_history'])) {
                if (is_string($ticket['remarks_history'])) {
                    $remarksHistory = json_decode($ticket['remarks_history'], true) ?? [];
                } else if (is_array($ticket['remarks_history'])) {
                    $remarksHistory = $ticket['remarks_history'];
                }
            }

            // Add new remark with status change
            $remarksHistory[] = [
                'status' => $request->status,
                'remarks' => $request->remarks,
                'timestamp' => now()->toIso8601String(),
                'user' => auth()->user()->name ?? 'Admin User'
            ];

            $updateData = [
                'status' => $request->status,
                'ticket_remarks' => $request->remarks,
                'remarks_history' => json_encode($remarksHistory),
                'updated_at' => now()
            ];

            $updateResult = $this->supabase->update('tickets_tb', $updateData, [
                'ticket_id' => ['eq', $id]
            ]);

            if (!$updateResult['success']) {
                throw new \Exception($updateResult['error'] ?? 'Failed to update ticket');
            }

            // Get the updated ticket
            $updatedResult = $this->supabase->query('tickets_tb', '*', [
                'select' => '*',
                'filter' => [
                    'ticket_id' => ['eq', $id]
                ]
            ]);

            if (!$updatedResult['success'] || empty($updatedResult['data'])) {
                throw new \Exception('Failed to fetch updated ticket');
            }

            $updatedTicket = $updatedResult['data'][0];

            return response()->json([
                'success' => true,
                'message' => 'Ticket updated successfully',
                'data' => [
                    'ticket_id' => $updatedTicket['ticket_id'],
                    'subject' => $updatedTicket['subject'],
                    'status' => $updatedTicket['status'],
                    'created_at' => $updatedTicket['created_at'],
                    'updated_at' => $updatedTicket['updated_at'],
                    'remarks' => $updatedTicket['ticket_remarks'],
                    'remarksHistory' => json_decode($updatedTicket['remarks_history'], true),
                    'description' => $updatedTicket['description'],
                    'category' => $updatedTicket['category'],
                    'subcategory' => $updatedTicket['subcategory'],
                    'priority' => $updatedTicket['priority'],
                    'ticket_reference' => $updatedTicket['ticket_reference'],
                    'account_number' => $updatedTicket['account_number'] ?? '-'
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating ticket: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating ticket: ' . $e->getMessage()
            ], 500);
        }
    }

    private function generateTicketReference()
    {
        $prefix = 'TKT';
        $timestamp = now()->format('Ymd');
        $random = str_pad(random_int(1, 9999), 4, '0', STR_PAD_LEFT);
        return $prefix . $timestamp . $random;
    }
} 