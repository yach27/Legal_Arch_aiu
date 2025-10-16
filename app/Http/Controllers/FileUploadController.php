<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class FileUploadController extends Controller
{
    public function store(Request $request)
    {
        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('uploads');
            return response()->json(['path' => $path], 201);
        }

        return response()->json(['error' => 'No file uploaded'], 400);
    }
}

