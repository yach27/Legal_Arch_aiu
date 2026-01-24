<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;

class AccountController extends Controller
{
    /**
     * Display the account management page
     */
    public function index(Request $request)
    {
        // Get all users with their permissions
        $users = User::select('user_id', 'firstname', 'lastname', 'middle_name', 'email', 'role', 'can_edit', 'can_delete', 'can_archive', 'can_upload', 'can_view')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                return [
                    'user_id' => $user->user_id,
                    'firstname' => $user->firstname,
                    'lastname' => $user->lastname,
                    'middle_name' => $user->middle_name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status, // Get actual status
                    'permissions' => [
                        'can_edit' => $user->can_edit,
                        'can_delete' => $user->can_delete,
                        'can_archive' => $user->can_archive,
                        'can_upload' => $user->can_upload,
                        'can_view' => $user->can_view,
                    ],
                ];
            });

        return Inertia::render('Admin/Account/index', [
            'users' => $users,
        ]);
    }

    /**
     * Get all users (API)
     */
    public function getUsers(Request $request)
    {
        $users = User::select('user_id', 'firstname', 'lastname', 'middle_name', 'email', 'role', 'created_at', 'can_edit', 'can_delete', 'can_archive', 'can_upload', 'can_view')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                return [
                    'user_id' => $user->user_id,
                    'firstname' => $user->firstname,
                    'lastname' => $user->lastname,
                    'middle_name' => $user->middle_name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                    'created_at' => $user->created_at,
                    'permissions' => [
                        'can_edit' => $user->can_edit,
                        'can_delete' => $user->can_delete,
                        'can_archive' => $user->can_archive,
                        'can_upload' => $user->can_upload,
                        'can_view' => $user->can_view,
                    ],
                ];
            });

        return response()->json(['users' => $users]);
    }

    /**
     * Store a newly created user
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'firstname' => 'required|string|max:255',
            'lastname' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,staff',
            'permissions' => 'array',
            'status' => 'in:active,inactive',
        ]);

        try {
            $userData = [
                'firstname' => $validated['firstname'],
                'lastname' => $validated['lastname'],
                'middle_name' => $validated['middle_name'] ?? null,
                'email' => $validated['email'],
                'password' => bcrypt($validated['password']),
                'role' => $validated['role'],
                'status' => $validated['status'] ?? 'active',
            ];

            if (isset($validated['permissions'])) {
                $permissions = $validated['permissions'];
                $userData['can_edit'] = $permissions['can_edit'] ?? false;
                $userData['can_delete'] = $permissions['can_delete'] ?? false;
                $userData['can_archive'] = $permissions['can_archive'] ?? false;
                $userData['can_upload'] = $permissions['can_upload'] ?? false;
                $userData['can_view'] = $permissions['can_view'] ?? false;
            } else {
                if ($validated['role'] === 'admin') {
                     $userData['can_edit'] = true;
                     $userData['can_delete'] = true;
                     $userData['can_archive'] = true;
                     $userData['can_upload'] = true;
                     $userData['can_view'] = true;
                } else {
                     $userData['can_view'] = true;
                }
            }

            $user = User::create($userData);

            return response()->json([
                'message' => 'User created successfully',
                'user' => [
                    'user_id' => $user->user_id,
                    'firstname' => $user->firstname,
                    'lastname' => $user->lastname,
                    'middle_name' => $user->middle_name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                    'permissions' => [
                        'can_edit' => $user->can_edit,
                        'can_delete' => $user->can_delete,
                        'can_archive' => $user->can_archive,
                        'can_upload' => $user->can_upload,
                        'can_view' => $user->can_view,
                    ],
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create user: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update the specified user
     */
    public function update(Request $request, $user_id)
    {
        $user = User::where('user_id', $user_id)->first();

        if (!$user) {
            return response()->json([
                'message' => 'User not found',
            ], 404);
        }

        $validated = $request->validate([
            'firstname' => 'sometimes|required|string|max:255',
            'lastname' => 'sometimes|required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $user_id . ',user_id',
            'password' => 'nullable|string|min:6',
            'role' => 'sometimes|required|in:admin,staff',
            'permissions' => 'array',
            'status' => 'in:active,inactive',
        ]);

        try {
            $updateData = [
                'firstname' => $validated['firstname'] ?? $user->firstname,
                'lastname' => $validated['lastname'] ?? $user->lastname,
                'middle_name' => $validated['middle_name'] ?? $user->middle_name,
                'email' => $validated['email'] ?? $user->email,
                'role' => $validated['role'] ?? $user->role,
                'status' => $validated['status'] ?? $user->status,
                'password' => isset($validated['password']) ? bcrypt($validated['password']) : $user->password,
            ];

            // Handle permissions if provided
            if (isset($validated['permissions'])) {
                $permissions = $validated['permissions'];
                $updateData['can_edit'] = $permissions['can_edit'] ?? $user->can_edit;
                $updateData['can_delete'] = $permissions['can_delete'] ?? $user->can_delete;
                $updateData['can_archive'] = $permissions['can_archive'] ?? $user->can_archive;
                $updateData['can_upload'] = $permissions['can_upload'] ?? $user->can_upload;
                $updateData['can_view'] = $permissions['can_view'] ?? $user->can_view;
            }

            $user->update($updateData);

            // Send notification if permissions changed and user is staff
            if ($user->role === 'staff' && isset($validated['permissions'])) {
                 \App\Models\Notification::create([
                    'user_id' => $user->user_id,
                    'title' => 'Permissions Updated',
                    'message' => 'Your account permissions have been updated by the administrator.',
                    'type' => 'info',
                    'is_read' => false,
                ]);
            }

            return response()->json([
                'message' => 'User updated successfully',
                'user' => [
                    'user_id' => $user->user_id,
                    'firstname' => $user->firstname,
                    'lastname' => $user->lastname,
                    'middle_name' => $user->middle_name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                    'permissions' => [
                        'can_edit' => $user->can_edit,
                        'can_delete' => $user->can_delete,
                        'can_archive' => $user->can_archive,
                        'can_upload' => $user->can_upload,
                        'can_view' => $user->can_view,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update user: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete the specified user
     */
    public function destroy($user_id)
    {
        $user = User::where('user_id', $user_id)->first();

        if (!$user) {
            return response()->json([
                'message' => 'User not found',
            ], 404);
        }

        try {
            // Optional: Delete user's activity logs first
            $user->activityLogs()->delete();

            $user->delete();

            return response()->json([
                'message' => 'User deleted successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete user: ' . $e->getMessage(),
            ], 500);
        }
    }
}
