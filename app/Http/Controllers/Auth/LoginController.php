<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Models\ActivityLog;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $credentials = $request->only('email', 'password');

        Log::info('Login attempt', ['email' => $request->email]);

        if (!Auth::attempt($credentials, true)) { // 'true' enables "remember me"
            Log::warning('Login failed - invalid credentials', ['email' => $request->email]);
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        // Debug Auth::user()
        $authUser = Auth::user();
        Log::info('Auth::user() result', [
            'is_null' => is_null($authUser),
            'has_id' => $authUser ? !is_null($authUser->getKey()) : false,
            'id_value' => $authUser ? $authUser->getKey() : null,
            'email' => $authUser ? $authUser->email : null,
            'class' => $authUser ? get_class($authUser) : null,
        ]);

        // Get user directly from database
        $user = User::where('email', $request->email)->first();

        Log::info('Database user result', [
            'is_null' => is_null($user),
            'has_id' => $user ? !is_null($user->getKey()) : false,
            'id_value' => $user ? $user->getKey() : null,
            'email' => $user ? $user->email : null,
        ]);

        if (!$user || !$user->getKey()) {
            Log::error('User not found or missing ID', [
                'user_exists' => !is_null($user),
                'user_id' => $user ? $user->getKey() : null,
            ]);
            return response()->json([
                'message' => 'User authentication failed'
            ], 500);
        }

        try {
            // Create token
            Log::info('Creating token for user', ['user_id' => $user->getKey()]);
            $tokenResult = $user->createToken('auth_token');
            $token = $tokenResult->plainTextToken;

            Log::info('Token created successfully', [
                'user_id' => $user->getKey(),
                'token_id' => $tokenResult->accessToken->id,
                'token_length' => strlen($token),
            ]);

            // Log login activity
            ActivityLog::create([
                'user_id' => $user->user_id,
                'doc_id' => null,
                'activity_type' => 'login',
                'activity_time' => now(),
                'activity_details' => 'User logged in',
            ]);

            return response()->json([
                'message' => 'Login successful',
                'access_token' => $token,
                'token_type' => 'Bearer',
                'user' => $user,
                'redirect' => '/admin/dashboard'
            ]);

        } catch (\Exception $e) {
            Log::error('Token creation failed', [
                'user_id' => $user ? $user->getKey() : null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Token creation failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        Log::info('Logout attempt', ['user_id' => $user->getKey()]);

        // Log logout activity
        ActivityLog::create([
            'user_id' => $user->user_id,
            'doc_id' => null,
            'activity_type' => 'logout',
            'activity_time' => now(),
            'activity_details' => 'User logged out',
        ]);

        $deletedCount = $user->tokens()->count();
        $user->tokens()->delete();

        Log::info('Logout successful', [
            'user_id' => $user->getKey(),
            'tokens_deleted' => $deletedCount
        ]);

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }
}