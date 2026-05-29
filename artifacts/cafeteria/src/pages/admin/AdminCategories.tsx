import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useListCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminCategories() {
  const qc = useQueryClient();
  const { data: categories = [], isLoading } = useListCategories();
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [formError, setFormError] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: getListCategoriesQueryKey() });

  const openCreate = () => { setEditingId(null); setName(""); setDescription(""); setImageUrl(""); setFormError(""); setShowForm(true); };
  const openEdit = (c: typeof categories[0]) => {
    setEditingId(c.id);
    setName(c.name);
    setDescription(c.description ?? "");
    setImageUrl(c.imageUrl ?? "");
    setFormError("");
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const data = { name, description: description || null, imageUrl: imageUrl || null };
    if (editingId) {
      updateCat.mutate({ id: editingId, data }, {
        onSuccess: () => { invalidate(); setShowForm(false); },
        onError: (err: any) => setFormError(err?.data?.error ?? "Failed")
      });
    } else {
      createCat.mutate({ data }, {
        onSuccess: () => { invalidate(); setShowForm(false); },
        onError: (err: any) => setFormError(err?.data?.error ?? "Failed")
      });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this category?")) return;
    deleteCat.mutate({ id }, { onSuccess: invalidate });
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">Categories</h1><p className="text-muted-foreground text-sm">Organize your menu</p></div>
          <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Category</Button>
        </div>

        {showForm && (
          <div className="bg-card border border-card-border rounded-xl p-5 max-w-lg">
            <h2 className="font-semibold mb-4">{editingId ? "Edit Category" : "New Category"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5"><Label>Name *</Label><Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Main Course" /></div>
              <div className="space-y-1.5"><Label>Description</Label><Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..." /></div>
              <div className="space-y-1.5"><Label>Image URL</Label><Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." /></div>
              {formError && <p className="text-sm text-destructive">{formError}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={createCat.isPending || updateCat.isPending}>{editingId ? "Save" : "Create"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="bg-card border border-card-border rounded-xl p-4">
                {cat.imageUrl && <img src={cat.imageUrl} alt={cat.name} className="w-full h-24 object-cover rounded-lg mb-3" />}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{cat.name}</h3>
                    {cat.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{cat.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{cat.productCount} products</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(cat)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(cat.id)} disabled={deleteCat.isPending}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">No categories yet. Add one above.</div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
