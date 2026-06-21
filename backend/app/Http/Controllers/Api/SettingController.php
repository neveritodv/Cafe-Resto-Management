<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index() { return response()->json(Setting::all()->groupBy('group')); }
    public function store(Request $request) {
        $validated = $request->validate(['key'=>'required|string','value'=>'nullable','group'=>'nullable|string']);
        $setting = Setting::set($validated['key'], $validated['value'] ?? '', $validated['group'] ?? 'general');
        return response()->json($setting);
    }
    public function update(Request $request, $key) {
        $setting = Setting::where('key', $key)->firstOrFail();
        $validated = $request->validate(['value'=>'nullable']);
        $setting->update(['value' => $validated['value']]);
        return response()->json($setting);
    }
    public function show($key) { return response()->json(['key' => $key, 'value' => Setting::get($key)]); }
    public function destroy($key) { $setting = Setting::where('key', $key)->firstOrFail(); $setting->delete(); return response()->json(['message' => 'Deleted']); }
}