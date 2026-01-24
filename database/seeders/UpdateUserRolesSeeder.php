<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UpdateUserRolesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Update first user as admin (if exists)
        $firstUser = User::first();
        if ($firstUser) {
            $firstUser->update(['role' => 'admin']);
            $this->command->info('Updated first user as admin: ' . $firstUser->email);
        }

        // Create admin user if not exists
        $adminEmail = 'admin@example.com';
        if (!User::where('email', $adminEmail)->exists()) {
            User::create([
                'firstname' => 'Admin',
                'lastname' => 'User',
                'middle_name' => null,
                'email' => $adminEmail,
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]);
            $this->command->info('Created admin user: ' . $adminEmail);
        }

        // Create staff user if not exists
        $staffEmail = 'staff@example.com';
        if (!User::where('email', $staffEmail)->exists()) {
            User::create([
                'firstname' => 'Staff',
                'lastname' => 'User',
                'middle_name' => null,
                'email' => $staffEmail,
                'password' => Hash::make('password'),
                'role' => 'staff',
            ]);
            $this->command->info('Created staff user: ' . $staffEmail);
        }
    }
}
