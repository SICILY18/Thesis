<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;

class SupabaseService
{
    private $httpClient;
    private $supabaseUrl;
    private $serviceRoleKey;
    private $anonKey;

    public function __construct()
    {
        $this->supabaseUrl = config('supabase.url');
        $this->serviceRoleKey = config('supabase.service_role_key');
        $this->anonKey = config('supabase.anon_key');
        
        $this->httpClient = new Client([
            'base_uri' => $this->supabaseUrl,
            'timeout' => config('supabase.api.timeout', 30),
            'headers' => [
                'Content-Type' => 'application/json',
                'apikey' => $this->serviceRoleKey,
                'Authorization' => 'Bearer ' . $this->serviceRoleKey,
            ]
        ]);
    }

    /**
     * Authenticate user with Supabase
     */
    public function signInWithEmailAndPassword($email, $password)
    {
        try {
            $response = $this->httpClient->post('/auth/v1/token?grant_type=password', [
                'json' => [
                    'email' => $email,
                    'password' => $password
                ]
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            return [
                'success' => true,
                'data' => $data,
                'user' => $data['user'] ?? null,
                'session' => $data
            ];
        } catch (RequestException $e) {
            Log::error('Supabase authentication error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        } catch (Exception $e) {
            Log::error('Supabase authentication error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Sign up a new user
     */
    public function signUp($email, $password, $metadata = [])
    {
        try {
            $response = $this->httpClient->post('/auth/v1/signup', [
                'json' => [
                    'email' => $email,
                    'password' => $password,
                    'data' => $metadata
                ]
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            return [
                'success' => true,
                'data' => $data
            ];
        } catch (RequestException $e) {
            Log::error('Supabase signup error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        } catch (Exception $e) {
            Log::error('Supabase signup error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Sign out user
     */
    public function signOut($accessToken)
    {
        try {
            $response = $this->httpClient->post('/auth/v1/logout', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken
                ]
            ]);

            return [
                'success' => true,
                'data' => json_decode($response->getBody()->getContents(), true)
            ];
        } catch (RequestException $e) {
            Log::error('Supabase signout error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        } catch (Exception $e) {
            Log::error('Supabase signout error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get user from access token
     */
    public function getUser($accessToken)
    {
        try {
            $response = $this->httpClient->get('/auth/v1/user', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken
                ]
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            return [
                'success' => true,
                'user' => $data
            ];
        } catch (RequestException $e) {
            Log::error('Supabase get user error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        } catch (Exception $e) {
            Log::error('Supabase get user error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Execute database query
     */
    private function executeQuery($method, $table, $data = null, $params = [])
    {
        try {
            $url = "/rest/v1/{$table}";
            
            if (!empty($params)) {
                $url .= '?' . http_build_query($params);
            }

            $options = [
                'headers' => [
                    'Content-Type' => 'application/json',
                    'apikey' => $this->serviceRoleKey,
                    'Authorization' => 'Bearer ' . $this->serviceRoleKey,
                    'Prefer' => 'return=representation'
                ]
            ];

            if ($data) {
                $options['json'] = $data;
            }

            $response = $this->httpClient->request($method, $url, $options);
            $responseData = json_decode($response->getBody()->getContents(), true);

            return [
                'success' => true,
                'data' => $responseData
            ];
        } catch (RequestException $e) {
            Log::error('Supabase database error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        } catch (Exception $e) {
            Log::error('Supabase database error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Query staff table by email
     */
    public function getStaffByEmail($email)
    {
        $tableName = config('supabase.tables.staff');
        $result = $this->executeQuery('GET', $tableName, null, ['email' => "eq.{$email}"]);
        
        if ($result['success'] && !empty($result['data'])) {
            $result['data'] = $result['data'][0]; // Return single record
        } else {
            $result['data'] = null;
        }
        
        return $result;
    }

    /**
     * Query staff table by username
     */
    public function getStaffByUsername($username)
    {
        $tableName = config('supabase.tables.staff');
        $result = $this->executeQuery('GET', $tableName, null, ['username' => "eq.{$username}"]);
        
        if ($result['success'] && !empty($result['data'])) {
            $result['data'] = $result['data'][0]; // Return single record
        } else {
            $result['data'] = null;
        }
        
        return $result;
    }

    /**
     * Create staff record
     */
    public function createStaff($staffData)
    {
        $tableName = config('supabase.tables.staff');
        return $this->executeQuery('POST', $tableName, $staffData);
    }

    /**
     * Update staff record
     */
    public function updateStaff($id, $staffData)
    {
        $tableName = config('supabase.tables.staff');
        return $this->executeQuery('PATCH', $tableName, $staffData, ['id' => "eq.{$id}"]);
    }

    /**
     * Delete staff record
     */
    public function deleteStaff($id)
    {
        $tableName = config('supabase.tables.staff');
        return $this->executeQuery('DELETE', $tableName, null, ['id' => "eq.{$id}"]);
    }

    /**
     * Get all customers
     */
    public function getCustomers()
    {
        $tableName = config('supabase.tables.customers');
        return $this->executeQuery('GET', $tableName);
    }

    /**
     * Get all payments
     */
    public function getPayments()
    {
        $tableName = config('supabase.tables.payments');
        return $this->executeQuery('GET', $tableName);
    }

    /**
     * Get all bills
     */
    public function getBills()
    {
        $tableName = config('supabase.tables.bills');
        return $this->executeQuery('GET', $tableName);
    }

    /**
     * Get all tickets
     */
    public function getAllTickets()
    {
        $tableName = config('supabase.tables.tickets');
        return $this->executeQuery('GET', $tableName);
    }

    /**
     * Create ticket record
     */
    public function createTicket($ticketData)
    {
        $tableName = config('supabase.tables.tickets');
        return $this->executeQuery('POST', $tableName, $ticketData);
    }

    /**
     * Update ticket record
     */
    public function updateTicket($id, $ticketData)
    {
        $tableName = config('supabase.tables.tickets');
        return $this->executeQuery('PATCH', $tableName, $ticketData, ['id' => "eq.{$id}"]);
    }

    /**
     * Delete ticket record
     */
    public function deleteTicket($id)
    {
        $tableName = config('supabase.tables.tickets');
        return $this->executeQuery('DELETE', $tableName, null, ['id' => "eq.{$id}"]);
    }

    /**
     * Generic database query method
     */
    public function query($table, $select = '*', $conditions = [])
    {
        try {
            $url = "/rest/v1/{$table}";
            $params = [];

            // Handle select fields
            if ($select !== '*') {
                $params['select'] = $select;
            }

            // Handle conditions
            foreach ($conditions as $key => $value) {
                if ($key === 'order') {
                    $params['order'] = $value;
                } else if ($key === 'limit') {
                    $params['limit'] = $value;
                } else if ($key === 'offset') {
                    $params['offset'] = $value;
                } else if ($key === 'filter') {
                    // Handle filter conditions properly for Supabase
                    foreach ($value as $column => $condition) {
                        if (is_array($condition) && count($condition) >= 2) {
                            $operator = $condition[0];
                            $val = $condition[1];
                            $params[$column] = "{$operator}.{$val}";
                        }
                    }
                } else {
                    // For all other conditions, add them directly
                    $params[$key] = $value;
                }
            }

            \Log::info('Supabase query:', [
                'url' => $url,
                'params' => $params
            ]);

            $response = $this->httpClient->get($url, [
                'query' => $params,
                'headers' => [
                    'apikey' => $this->serviceRoleKey,
                    'Authorization' => 'Bearer ' . $this->serviceRoleKey
                ]
            ]);

            $data = json_decode($response->getBody(), true);

            \Log::info('Supabase query response:', [
                'success' => true,
                'count' => count($data),
                'sample' => !empty($data) ? $data[0] : null,
                'url' => $url,
                'params' => $params
            ]);

            return [
                'success' => true,
                'data' => $data,
                'count' => count($data),
                'first_record' => !empty($data) ? $data[0] : null
            ];

        } catch (\Exception $e) {
            \Log::error('Supabase query error:', [
                'message' => $e->getMessage(),
                'response' => $e->getResponse() ? $e->getResponse()->getBody()->getContents() : null,
                'table' => $table,
                'select' => $select,
                'conditions' => $conditions
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'data' => [],
                'count' => 0,
                'first_record' => null
            ];
        }
    }

    /**
     * Insert data into table
     */
    public function insert($table, $data)
    {
        return $this->executeQuery('POST', $table, $data);
    }

    /**
     * Update data in table
     */
    public function update($table, $data, $conditions = [])
    {
        $params = [];
        
        if (isset($conditions['filter'])) {
            foreach ($conditions['filter'] as $column => $condition) {
                if (is_array($condition) && count($condition) >= 2) {
                    $operator = $condition[0];
                    $value = $condition[1];
                    $params[$column] = "{$operator}.{$value}";
                }
            }
        } else {
            foreach ($conditions as $key => $value) {
                if (is_array($value) && count($value) >= 2) {
                    $operator = $value[0];
                    $val = $value[1];
                    $params[$key] = "{$operator}.{$val}";
                } else {
                    $params[$key] = $value;
                }
            }
        }
        
        return $this->executeQuery('PATCH', $table, $data, $params);
    }

    /**
     * Delete data from table
     */
    public function delete($table, $conditions = [])
    {
        $params = [];
        
        foreach ($conditions as $condition) {
            if (isset($condition['column'], $condition['operator'], $condition['value'])) {
                $params[$condition['column']] = $condition['operator'] . '.' . $condition['value'];
            }
        }
        
        return $this->executeQuery('DELETE', $table, null, $params);
    }

    /**
     * Get a single record by ID
     */
    public function getById($table, $id)
    {
        $result = $this->executeQuery('GET', $table, null, ['id' => "eq.{$id}"]);
        
        if ($result['success'] && !empty($result['data'])) {
            $result['data'] = $result['data'][0]; // Return single record
        } else {
            $result['data'] = null;
        }
        
        return $result;
    }

    /**
     * Get all staff
     */
    public function getAllStaff()
    {
        $tableName = config('supabase.tables.staff');
        return $this->executeQuery('GET', $tableName);
    }

    /**
     * Get all announcements
     */
    public function getAllAnnouncements()
    {
        $tableName = config('supabase.tables.announcements');
        return $this->executeQuery('GET', $tableName);
    }

    /**
     * Create announcement record
     */
    public function createAnnouncement($announcementData)
    {
        $tableName = config('supabase.tables.announcements');
        return $this->executeQuery('POST', $tableName, $announcementData);
    }

    /**
     * Update announcement record
     */
    public function updateAnnouncement($id, $announcementData)
    {
        $tableName = config('supabase.tables.announcements');
        return $this->executeQuery('PATCH', $tableName, $announcementData, ['id' => "eq.{$id}"]);
    }

    /**
     * Delete announcement record
     */
    public function deleteAnnouncement($id)
    {
        $tableName = config('supabase.tables.announcements');
        return $this->executeQuery('DELETE', $tableName, null, ['id' => "eq.{$id}"]);
    }

    /**
     * Get all rates
     */
    public function getAllRates()
    {
        $tableName = config('supabase.tables.rates');
        return $this->executeQuery('GET', $tableName);
    }

    /**
     * Create rate record
     */
    public function createRate($rateData)
    {
        $tableName = config('supabase.tables.rates');
        return $this->executeQuery('POST', $tableName, $rateData);
    }

    /**
     * Update rate record
     */
    public function updateRate($id, $rateData)
    {
        $tableName = config('supabase.tables.rates');
        return $this->executeQuery('PATCH', $tableName, $rateData, ['id' => "eq.{$id}"]);
    }

    /**
     * Delete rate record
     */
    public function deleteRate($id)
    {
        $tableName = config('supabase.tables.rates');
        return $this->executeQuery('DELETE', $tableName, null, ['id' => "eq.{$id}"]);
    }

    /**
     * Create customer record
     */
    public function createCustomer($customerData)
    {
        $tableName = config('supabase.tables.customers');
        return $this->executeQuery('POST', $tableName, $customerData);
    }

    /**
     * Update customer record
     */
    public function updateCustomer($id, $customerData)
    {
        $tableName = config('supabase.tables.customers');
        return $this->executeQuery('PATCH', $tableName, $customerData, ['id' => "eq.{$id}"]);
    }

    /**
     * Delete customer record
     */
    public function deleteCustomer($id)
    {
        $tableName = config('supabase.tables.customers');
        return $this->executeQuery('DELETE', $tableName, null, ['id' => "eq.{$id}"]);
    }

    /**
     * Get customer by ID
     */
    public function getCustomer($id)
    {
        $tableName = config('supabase.tables.customers');
        $result = $this->executeQuery('GET', $tableName, null, ['id' => "eq.{$id}"]);
        
        if ($result['success'] && !empty($result['data'])) {
            $result['data'] = $result['data'][0]; // Return single record
        } else {
            $result['data'] = null;
        }
        
        return $result;
    }
} 