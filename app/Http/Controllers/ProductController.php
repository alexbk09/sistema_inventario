<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\ProductImage;
use App\Jobs\ProcessProductImage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $search = trim((string) $request->input('search', ''));
        $products = Product::query()
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->with(['categories:id,name', 'images'])
            ->paginate(12)
            ->withQueryString();

        $totalProductsValueUsd = (float) Product::query()
            ->select(DB::raw('SUM(stock * price_usd) as total'))
            ->value('total');

        $summary = [
            'total_products' => (int) Product::count(),
            'total_products_value_usd' => $totalProductsValueUsd,
            'last_30_days_exits' => (int) InventoryMovement::where('type', 'exit')
                ->where('created_at', '>=', now()->subDays(30))
                ->sum('quantity'),
            'total_entries' => (int) InventoryMovement::where('type', 'entry')->sum('quantity'),
        ];
        return Inertia::render('Admin/Product/Index', [
            'products' => $products,
            'filters' => ['search' => $search],
            'summary' => $summary,
            'warehouses' => \App\Models\Warehouse::orderBy('name')->get(['id','name','code']),
        ]);
    }

    public function import(Request $request, \App\Services\InventoryService $inventory)
    {
        $data = $request->validate([
            'file' => ['required','file','mimes:xlsx,xls,csv'],
            'warehouse_id' => ['nullable','exists:warehouses,id'],
        ]);

        $path = $request->file('file')->getPathname();

        // Try to use PhpSpreadsheet
        try {
            $reader = \PhpOffice\PhpSpreadsheet\IOFactory::load($path);
            $sheet = $reader->getActiveSheet();
            $rows = $sheet->toArray();
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'No se pudo leer el archivo. Instala PhpSpreadsheet (phpoffice/phpspreadsheet).');
        }

        // Expect header in first row: name,sku,price_usd,stock,description,category_names,image_url
        $header = array_map('strtolower', array_map('trim', $rows[0] ?? []));
        $created = 0;
        DB::transaction(function () use ($rows, $header, &$created, $data, $inventory) {
            for ($i = 1; $i < count($rows); $i++) {
                $row = $rows[$i];
                if (!isset($row[0]) || trim($row[0]) === '') continue;
                $map = [];
                foreach ($header as $idx => $col) {
                    $map[$col] = $row[$idx] ?? null;
                }

                $name = $map['name'] ?? null;
                $sku = $map['sku'] ?? null;
                $price = isset($map['price_usd']) ? (float)$map['price_usd'] : 0;
                $stock = isset($map['stock']) ? (int)$map['stock'] : 0;
                $description = $map['description'] ?? null;

                if (!$name || !$sku) continue;

                $product = \App\Models\Product::create([
                    'name' => $name,
                    'sku' => $sku,
                    'price_usd' => $price,
                    'stock' => $stock,
                    'description' => $description,
                ]);

                // Handle image_url: try download
                if (!empty($map['image_url'])) {
                    try {
                        $resp = \Illuminate\Support\Facades\Http::withOptions(['verify' => false])->get($map['image_url']);
                        if ($resp->ok()) {
                            $ext = pathinfo(parse_url($map['image_url'], PHP_URL_PATH), PATHINFO_EXTENSION) ?: 'jpg';
                            $filename = 'products/' . uniqid() . '.' . $ext;
                            \Illuminate\Support\Facades\Storage::disk('public')->put($filename, $resp->body());
                            $image = \App\Models\ProductImage::create([
                                'product_id' => $product->id,
                                'path' => $filename,
                                'is_primary' => true,
                                'sort_order' => 0,
                            ]);
                            try {
                                \App\Jobs\ProcessProductImage::dispatch($image->id);
                            } catch (\Throwable $e) {
                                // ignore dispatch errors for imports
                            }
                            $product->image_url = $filename;
                            $product->save();
                        }
                    } catch (\Throwable $e) {
                        // ignore image errors
                    }
                }

                // If warehouse provided, register entry movement for the stock
                if (!empty($data['warehouse_id']) && $stock > 0) {
                    $inventory->registerEntry($product, $stock, $price, null, 'Importación masiva', null, $data['warehouse_id']);
                }

                $created++;
            }
        });

        return redirect()->route('admin.products.index')->with('success', "Productos importados: {$created}");
    }

    public function create()
    {
        return Inertia::render('Admin/Product/Create', [
            'categories' => Category::select('id','name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'sku' => ['required','string','max:64','unique:products,sku'],
            'category_ids' => ['array'],
            'category_ids.*' => ['exists:categories,id'],
            'category_id' => ['nullable','exists:categories,id'],
            'barcode' => ['nullable','string','max:255'],
            'description' => ['nullable','string'],
            'price_usd' => ['required','numeric','min:0'],
            'stock' => ['required','integer','min:0'],
            'is_featured' => ['boolean'],
        ]);

        // Compat: si no viene category_id, usar el primero de category_ids
        if (empty($data['category_id']) && !empty($data['category_ids'])) {
            $data['category_id'] = $data['category_ids'][0];
        }

        $product = Product::create(collect($data)->except('category_ids')->toArray());
        if (!empty($data['category_ids'])) {
            $product->categories()->sync($data['category_ids']);
        }

            if ($request->hasFile('images') || count($request->allFiles())>0) {
            $files = $request->file('images') ?? [];
            if (empty($files)) {
                $files = [];
                foreach ($request->allFiles() as $k => $f) {
                    if (str_starts_with((string)$k, 'images')) {
                        if (is_array($f)) {
                            $files = array_merge($files, $f);
                        } else {
                            $files[] = $f;
                        }
                    }
                }
            }
            Log::info('ProductController: found files to upload', ['product_id'=>$product->id,'count'=>count($files)]);
            foreach ($files as $index => $file) {
                $path = $file->store('products', 'public');

                $image = ProductImage::create([
                    'product_id' => $product->id,
                    'path' => $path,
                    'is_primary' => $index === 0,
                    'sort_order' => $index,
                ]);

                // Process image locally with free open-source model (Python script)
                        // Dispatch processing to queue (non-blocking)
                        try {
                            ProcessProductImage::dispatch($image->id);
                            Log::info('ProductController: dispatched ProcessProductImage', ['image_id'=>$image->id]);
                        } catch (\Throwable $e) {
                            Log::error('ProductController: failed to dispatch ProcessProductImage', ['error'=>$e->getMessage()]);
                        }

                if ($index === 0) {
                    $product->image_url = $path;
                    $product->save();
                }
            }
        }
        return redirect()->route('admin.products.index');
    }

    public function edit(Product $product)
    {
        $product->load('categories:id,name');
        return Inertia::render('Admin/Product/Edit', [
            'product' => $product,
            'categories' => Category::select('id','name')->get(),
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'sku' => ['required','string','max:64','unique:products,sku,'.$product->id],
            'category_ids' => ['array'],
            'category_ids.*' => ['exists:categories,id'],
            'category_id' => ['nullable','exists:categories,id'],
            'barcode' => ['nullable','string','max:255'],
            'description' => ['nullable','string'],
            'price_usd' => ['required','numeric','min:0'],
            'stock' => ['required','integer','min:0'],
            'is_featured' => ['boolean'],
        ]);

        if (empty($data['category_id']) && !empty($data['category_ids'])) {
            $data['category_id'] = $data['category_ids'][0];
        }

        $product->update(collect($data)->except('category_ids')->toArray());
        if (array_key_exists('category_ids', $data)) {
            $product->categories()->sync($data['category_ids'] ?? []);
        }

            if ($request->hasFile('images') || count($request->allFiles())>0) {
            $files = $request->file('images') ?? [];
            if (empty($files)) {
                $files = [];
                foreach ($request->allFiles() as $k => $f) {
                    if (str_starts_with((string)$k, 'images')) {
                        if (is_array($f)) {
                            $files = array_merge($files, $f);
                        } else {
                            $files[] = $f;
                        }
                    }
                }
            }
            Log::info('ProductController:update found files to upload', ['product_id'=>$product->id,'count'=>count($files)]);
            foreach ($files as $index => $file) {
                $path = $file->store('products', 'public');

                $image = ProductImage::create([
                    'product_id' => $product->id,
                    'path' => $path,
                    'is_primary' => $product->images()->count() === 0 && $index === 0,
                    'sort_order' => $product->images()->count() + $index,
                ]);

                // Dispatch processing to queue (non-blocking)
                try {
                    ProcessProductImage::dispatch($image->id);
                    Log::info('ProductController:update dispatched ProcessProductImage', ['image_id'=>$image->id]);
                } catch (\Throwable $e) {
                    Log::error('ProductController:update failed to dispatch ProcessProductImage', ['error'=>$e->getMessage()]);
                }
                if ($image->is_primary) {
                    $product->image_url = $path;
                    $product->save();
                }
            }
        }
        return redirect()->route('admin.products.index');
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return redirect()->route('admin.products.index');
    }

    /**
     * Ejecuta el script Python local para generar caption y tags.
     * El script devuelve JSON por stdout: {"caption":"...","tags":[...]}
     */
    
}
