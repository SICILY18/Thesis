<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TicketsController extends Controller
{
    /**
     * Get all tickets
     */
    public function index()
    {
        try {
            $tickets = DB::table('tickets_tb')
                ->select(
                    'ticket_id as id',
                    'ticket_reference',
                    'account_number',
                    'customer_name',
                    'category',
                    'subcategory',
                    'description',
                    'status',
                    'priority',
                    'ticket_remarks as remarks',
                    'remarks_history',
                    'created_at',
                    'updated_at'
                )
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $tickets
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching tickets: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching tickets'
            ], 500);
        }
    }

    /**
     * Create a new ticket
     */
    public function store(Request $request)
    {
        try {
            $ticketReference = 'TKT-' . strtoupper(Str::random(8));
            
            // Handle file upload if present
            $imagePath = null;
            if ($request->hasFile('image')) {
                $file = $request->file('image');
                $filename = time() . '_' . $file->getClientOriginalName();
                $imagePath = $file->storeAs('tickets', $filename, 'public');
            }

            $ticketId = DB::table('tickets_tb')->insertGetId([
                'ticket_reference' => $ticketReference,
                'account_number' => $request->account_number,
                'customer_name' => $request->customer_name,
                'category' => $request->category,
                'subcategory' => $request->subcategory,
                'description' => $request->description,
                'image_path' => $imagePath,
                'status' => 'Open',
                'priority' => $request->priority ?? 'Medium',
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Ticket created successfully',
                'ticket_reference' => $ticketReference
            ]);
        } catch (\Exception $e) {
            Log::error('Error creating ticket: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error creating ticket'
            ], 500);
        }
    }

    /**
     * Update a ticket
     */
    public function update(Request $request, $ticketReference)
    {
        try {
            $ticket = DB::table('tickets_tb')
                ->where('ticket_reference', $ticketReference)
                ->first();

            if (!$ticket) {
                Log::error('Ticket not found for update', [
                    'ticket_reference' => $ticketReference
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Ticket not found'
                ], 404);
            }
            
            Log::info('Found ticket for update', [
                'ticket_id' => $ticket->ticket_id,
                'current_status' => $ticket->status ?? 'unknown'
            ]);

            // Get staff info from session
            $staff = session('staff_data');
            $userName = $staff ? $staff['name'] : 'Admin User';

            // Update remarks history if new remarks provided
            $remarksHistory = [];
            if ($ticket->remarks_history) {
                $remarksHistory = is_string($ticket->remarks_history) 
                    ? json_decode($ticket->remarks_history, true) 
                    : $ticket->remarks_history;
            }
            
            // Ensure remarks history is an array
            if (!is_array($remarksHistory)) {
                $remarksHistory = [];
            }

            // Add new remark if provided
            if ($request->has('ticket_remarks') && !empty($request->ticket_remarks)) {
                $remarksHistory[] = [
                    'id' => count($remarksHistory) + 1,
                    'user' => $userName,
                    'remarks' => $request->ticket_remarks,
                    'timestamp' => now()->toISOString()
                ];
            }

            $updateData = [
                'updated_at' => now(),
                'remarks_history' => json_encode($remarksHistory)
            ];

            // Update status if provided
            if ($request->has('status')) {
                $updateData['status'] = $request->status;
            }

            // Update priority if provided
            if ($request->has('priority')) {
                $updateData['priority'] = $request->priority;
            }

            // Update ticket remarks if provided
            if ($request->has('ticket_remarks')) {
                $updateData['ticket_remarks'] = $request->ticket_remarks;
            }

            DB::table('tickets_tb')
                ->where('ticket_reference', $ticketReference)
                ->update($updateData);

            // Fetch the updated ticket
            $updatedTicket = DB::table('tickets_tb')
                ->select(
                    'ticket_id as id',
                    'ticket_reference',
                    'account_number',
                    'customer_name',
                    'category',
                    'subcategory',
                    'description',
                    'status',
                    'priority',
                    'ticket_remarks as remarks',
                    'remarks_history',
                    'created_at',
                    'updated_at'
                )
                ->where('ticket_reference', $ticketReference)
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Ticket updated successfully',
                'data' => $updatedTicket
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating ticket: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating ticket'
            ], 500);
        }
    }

    /**
     * Get ticket categories
     */
    public function getCategories()
    {
        $categories = [
            'Billing' => [
                'High Bill Complaint',
                'Wrong Bill',
                'Missing Bill',
                'Payment Not Reflected',
                'Other Billing Issues'
            ],
            'Technical' => [
                'No Water',
                'Low Pressure',
                'Leakage',
                'Meter Issues',
                'Connection Issues',
                'Other Technical Issues'
            ],
            'Service' => [
                'New Connection',
                'Reconnection',
                'Disconnection',
                'Transfer of Location',
                'Change of Name',
                'Other Service Requests'
            ],
            'Others' => [
                'General Inquiry',
                'Feedback',
                'Suggestion',
                'Complaint',
                'Other Concerns'
            ]
        ];

        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }
} 