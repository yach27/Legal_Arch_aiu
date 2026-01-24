<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\ActivityLog;

class LogoutController extends Controller
{
    /**
     * Handle logout request
     */
    public function logout(Request $request)
    {
        try {
            $user = $request->user();

            // Log logout activity before deleting token
            ActivityLog::create([
                'user_id' => $user->user_id,
                'doc_id' => null,
                'activity_type' => 'logout',
                'activity_time' => now(),
                'activity_details' => 'User logged out',
            ]);

            // Delete the current access token
            $user->currentAccessToken()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Logout failed: ' . $e->getMessage()
            ], 500);
        }
    }
}