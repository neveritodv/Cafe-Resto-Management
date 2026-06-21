<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request) {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'sometimes|in:admin,waiter,manager,customer',
        ]);
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'] ?? 'customer',
        ]);
        $token = $user->createToken('auth_token')->plainTextToken;
        return response()->json(['user' => $user, 'token' => $token], 201);
    }

public function login(Request $request) {
    $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    if (!Auth::attempt($request->only('email', 'password'))) {
        throw ValidationException::withMessages([
            'email' => ['Les identifiants sont incorrects.'],
        ]);
    }

    $user = User::where('email', $request->email)->first();
    $user->append('avatar_url');
    $token = $user->createToken('auth_token')->plainTextToken;

    return response()->json(['user' => $user, 'token' => $token]);
}

    public function logout(Request $request) {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnecté']);
    }

    public function user(Request $request) {
        $user = $request->user();
        $user->append('avatar_url');
        return response()->json($user);
    }

    public function updateProfile(Request $request) {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $request->user()->id,
        ]);

        $user = $request->user();
        $user->name = $request->name;
        $user->email = $request->email;
        $user->save();

        return response()->json($user);
    }

    public function changePassword(Request $request) {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Le mot de passe actuel est incorrect.'], 422);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json(['message' => 'Mot de passe mis à jour avec succès.']);
    }

    public function updateAvatar(Request $request) {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $user = $request->user();

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->avatar = $path;
        $user->save();

        return response()->json([
            'message' => 'Avatar mis à jour',
            'avatar' => asset('storage/' . $path),
        ]);
    }
}