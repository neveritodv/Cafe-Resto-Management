<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index() { return response()->json(Category::withCount('products')->get()); }
    public function active() { return response()->json(Category::active()->withCount('products')->get()); }
    public function store(Request $request) {
        $validated = $request->validate([
            'name' => 'required|string|unique:categories',
            'icon' => 'nullable|string',
            'color' => 'nullable|string|max:7',
            'is_active' => 'boolean',
        ]);
        return response()->json(Category::create($validated), 201);
    }
    public function show(Category $category) { return response()->json($category->load('products')); }
    public function update(Request $request, Category $category) {
        $validated = $request->validate([
            'name' => ['required', 'string', Rule::unique('categories')->ignore($category->id)],
            'icon' => 'nullable|string',
            'color' => 'nullable|string|max:7',
            'is_active' => 'boolean',
        ]);
        $category->update($validated);
        return response()->json($category);
    }
    public function destroy(Category $category) {
        if ($category->products()->count() > 0) {
            return response()->json(['message' => 'Cette catégorie contient des produits.'], 422);
        }
        $category->delete();
        return response()->json(['message' => 'Catégorie supprimée']);
    }
}