<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\SupabaseService;
use Illuminate\Support\Facades\Log;

class TicketsController extends Controller
{
    protected $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    /**
     * Get all tickets
     */
    public function index()
    {
        try {
            $result = $this->supabase->getAllTickets();

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to fetch tickets'
                ], 500);
            }

            // Sort by created_at descending
            $tickets = $result['data'];
            usort($tickets, function($a, $b) {
                return strtotime($b['created_at'] ?? 0) - strtotime($a['created_at'] ?? 0);
            });

            return response()->json([
                'success' => true,
                'data' => $tickets
            ]);
        } catch (\Exception $e) {
            Log::error('Ticket fetch failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch tickets: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new ticket
     */
    public function store(Request $request)
    {
        $request->validate([
            'subject' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'required|in:low,medium,high,urgent',
            'customer_id' => 'nullable|integer',
            'category' => 'required|string|max:100'
        ]);

        try {
            // Get staff info from session
            $staff = session('staff_data');
            
            if (!$staff) {
                return response()->json([
                    'success' => false,
                    'message' => 'User session not found'
                ], 401);
            }

            $ticketData = [
                'subject' => $request->subject,
                'description' => $request->description,
                'status' => 'open',
                'priority' => $request->priority,
                'category' => $request->category,
                'customer_id' => $request->customer_id,
                'assigned_to' => $staff['id'],
                'created_by' => $staff['id'],
                'remarks' => '',
                'created_at' => now()->toISOString(),
                'updated_at' => now()->toISOString(),
            ];

            $result = $this->supabase->createTicket($ticketData);

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to create ticket: ' . ($result['error'] ?? 'Unknown error')
                ], 500);
            }

            return response()->json([
                'success' => true,
                'message' => 'Ticket created successfully',
                'data' => $result['data']
            ]);
        } catch (\Exception $e) {
            Log::error('Ticket creation failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create ticket: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a ticket
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'status' => 'sometimes|in:open,pending,resolved,closed',
            'remarks' => 'sometimes|string',
            'assigned_to' => 'sometimes|integer',
            'priority' => 'sometimes|in:low,medium,high,urgent'
        ]);

        try {
            $updateData = array_filter([
                'status' => $request->status,
                'remarks' => $request->remarks,
                'assigned_to' => $request->assigned_to,
                'priority' => $request->priority,
                'updated_at' => now()->toISOString(),
            ], function($value) {
                return $value !== null;
            });

            $result = $this->supabase->updateTicket($id, $updateData);

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update ticket'
                ], 500);
            }

            return response()->json([
                'success' => true,
                'message' => 'Ticket updated successfully',
                'data' => $result['data']
            ]);
        } catch (\Exception $e) {
            Log::error('Ticket update failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update ticket: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific ticket
     */
    public function show($id)
    {
        try {
            $result = $this->supabase->getById(config('supabase.tables.tickets'), $id);

            if (!$result['success'] || !$result['data']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ticket not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $result['data']
            ]);
        } catch (\Exception $e) {
            Log::error('Ticket fetch failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch ticket: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a ticket (soft delete by changing status)
     */
    public function destroy($id)
    {
        try {
            $updateData = [
                'status' => 'deleted',
                'updated_at' => now()->toISOString()
            ];

            $result = $this->supabase->updateTicket($id, $updateData);

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete ticket'
                ], 500);
            }

            return response()->json([
                'success' => true,
                'message' => 'Ticket deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Ticket deletion failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete ticket: ' . $e->getMessage()
            ], 500);
        }
    }
} 