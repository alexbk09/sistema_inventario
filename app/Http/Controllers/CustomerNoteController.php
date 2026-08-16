<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\CustomerNote;
use Illuminate\Http\Request;

class CustomerNoteController extends Controller
{
    public function store(Request $request, Customer $customer)
    {
        $data = $request->validate([
            'body'      => ['required', 'string', 'max:2000'],
            'type'      => ['required', 'in:note,call,meeting,email'],
            'is_pinned' => ['boolean'],
        ]);

        $customer->notes()->create([
            'user_id'   => $request->user()?->id,
            'body'      => $data['body'],
            'type'      => $data['type'],
            'is_pinned' => $data['is_pinned'] ?? false,
        ]);

        return back()->with('success', 'Nota guardada.');
    }

    public function update(Request $request, Customer $customer, CustomerNote $note)
    {
        abort_if($note->customer_id !== $customer->id, 403);

        $data = $request->validate([
            'body'      => ['required', 'string', 'max:2000'],
            'type'      => ['required', 'in:note,call,meeting,email'],
            'is_pinned' => ['boolean'],
        ]);

        $note->update($data);

        return back()->with('success', 'Nota actualizada.');
    }

    public function destroy(Customer $customer, CustomerNote $note)
    {
        abort_if($note->customer_id !== $customer->id, 403);
        $note->delete();
        return back()->with('success', 'Nota eliminada.');
    }

    public function togglePin(Customer $customer, CustomerNote $note)
    {
        abort_if($note->customer_id !== $customer->id, 403);
        $note->update(['is_pinned' => !$note->is_pinned]);
        return back();
    }
}
