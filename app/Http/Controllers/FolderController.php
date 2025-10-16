<?php
namespace App\Http\Controllers;
use App\Models\Folder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class FolderController extends Controller
{
    public function index()
    {
        return response()->json(Folder::with(['children', 'category', 'creator'])->get());
    }

    public function store(Request $request)
    {
        // Add debug logging
        Log::info('Folder creation attempt', [
            'user' => $request->user() ? $request->user()->getKey() : null,
            'request_data' => $request->all()
        ]);

        // validate request
        $validated = $request->validate([
            'folder_name' => 'required|string|max:255',
            'folder_path' => 'required|string',
            'folder_type' => 'required|string',
            'category_id' => 'nullable|integer|exists:categories,category_id',
            'parent_folder_id' => 'nullable|integer|exists:folders,folder_id', // Fixed typo: removed space
        ]);

        // define base path
        $basePath = 'd:/legal_office';

        // if it has a parent folder, nest it
        if (!empty($validated['parent_folder_id'])) {
            $parent = Folder::find($validated['parent_folder_id']);
            $path = $parent->folder_path . '/' . $validated['folder_name'];
        } else {
            $path = $basePath . '/' . $validated['folder_name'];
        }

        try {
            // Create the physical directory
            if (!File::exists($path)) {
                File::makeDirectory($path, 0755, true);
            }

            // create folder record
            $folder = Folder::create([
                'folder_name'       => $validated['folder_name'],
                'folder_path'       => $path,
                'folder_type'       => $validated['folder_type'],
                'category_id'       => $validated['category_id'] ?? null,
                'parent_folder_id'  => $validated['parent_folder_id'] ?? null,
                'created_by'        => $request->user()->getKey(), // Use getKey() instead of ->id
            ]);

            Log::info('Folder created successfully', ['folder_id' => $folder->getKey()]);

            return response()->json([
                'message' => 'Folder created successfully',
                'folder'  => $folder
            ], 201);

        } catch (\Exception $e) {
            Log::error('Folder creation failed', [
                'error' => $e->getMessage(),
                'user_id' => $request->user() ? $request->user()->getKey() : null
            ]);

            return response()->json([
                'message' => 'Failed to create folder',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Add search endpoint
public function search(Request $request, $term)
{
    $folders = Folder::where('folder_name', 'LIKE', "%{$term}%")
                    ->orWhere('folder_path', 'LIKE', "%{$term}%")
                    ->with(['children', 'category', 'creator'])
                    ->get();
    
    return response()->json($folders);
}

// Add recent folders endpoint
public function recent($limit = 5)
{
    $folders = Folder::orderBy('updated_at', 'desc')
                    ->take($limit)
                    ->with(['children', 'category', 'creator'])
                    ->get();
    
    return response()->json($folders);
}

    public function show($id)
    {
        $folder = Folder::with(['children', 'category', 'creator'])->findOrFail($id);
        return response()->json($folder);
    }

    public function update(Request $request, $id)
    {
        $folder = Folder::findOrFail($id);  
        $folder->update($request->all());
        return response()->json($folder);
    }

    public function destroy($id)
    {
        $folder = Folder::findOrFail($id);

        // Also delete the physical folder if it exists
        if (File::exists($folder->folder_path)) {
            File::deleteDirectory($folder->folder_path);
        }

        $folder->delete();

        return response()->json(null, 204);
    }
    
    // Add tree structure endpoint for hierarchical folder display
    public function tree()
    {
        $folders = Folder::with(['children.children', 'category'])
                         ->whereNull('parent_folder_id') // Only root folders
                         ->get();
        
        return response()->json($folders);
    }
}