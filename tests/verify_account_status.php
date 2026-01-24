<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "Starting verification...\n";

// 1. Create a test user
echo "Creating test user...\n";
$user = User::create([
    'firstname' => 'Test',
    'lastname' => 'User',
    'email' => 'test_verification_' . time() . '@example.com',
    'password' => Hash::make('password'),
    'role' => 'staff',
    'status' => 'active'
]);

echo "User created with ID: " . $user->user_id . "\n";
echo "Initial Status: " . $user->status . "\n";

if ($user->status !== 'active') {
    echo "FAILED: Initial status should be active.\n";
    exit(1);
}

// 2. Update status to inactive
echo "Updating status to inactive...\n";
$user->update(['status' => 'inactive']);

// Refresh from DB
$user->refresh();
echo "Updated Status: " . $user->status . "\n";

if ($user->status !== 'inactive') {
    echo "FAILED: Status should be inactive.\n";
    exit(1);
}

// 3. Update status back to active
echo "Updating status back to active...\n";
$user->update(['status' => 'active']);
$user->refresh();
echo "Final Status: " . $user->status . "\n";

if ($user->status !== 'active') {
    echo "FAILED: Status should be active.\n";
    exit(1);
}

// 4. Cleanup
echo "Deleting test user...\n";
$user->delete();

echo "VERIFICATION SUCCESSFUL\n";
