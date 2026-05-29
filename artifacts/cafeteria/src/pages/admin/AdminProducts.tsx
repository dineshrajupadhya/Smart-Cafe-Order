import { useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useListProducts, useListCategories, useCreateProduct, useUpdateProduct, useDeleteProduct, getListProductsQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";

interface ProductForm {
  name: string; description: string; price: string; categoryId: string;
  stock: string; isAvailable: boolean; preparationTime: string; calories: string;
  isVegetarian: boolean; isSpicy: boolean; imageUrl: string;
}

const emptyForm: ProductForm = {
  name: "", description: "", price: "", categoryId: "", stock: "10",
  isAvailable: true, preparationTime: "", calories: "", isVegetarian: false, isSpicy: false, imageUrl: ""
};

export default function AdminProducts() {
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useListProducts();
  const { data: categories = [] } = useListCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [formError, setFormError] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: getListProductsQueryKey() });

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setFormError(""); setShowForm(true); };
  const openEdit = (p: typeof products[0]) => {
    setEditingId(p.id);
    setForm({
      name: p.name, description: p.description ?? "", price: p.price.toString(),
      categoryId: p.categoryId.toString(), stock: p.stock.toString(),
      isAvailable: p.isAvailable ?? true, preparationTime: p.preparationTime?.toString() ?? "",
      calories: p.calories?.toString() ?? "", isVegetarian: p.isVegetarian ?? false,
      isSpicy: p.isSpicy ?? false, imageUrl: p.imageUrl ?? ""
    });
    setFormError("");
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const data = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      categoryId: parseInt(form.categoryId),
      stock: parseInt(form.stock),
      isAvailable: form.isAvailable,
      preparationTime: form.preparationTime ? parseInt(form.preparationTime) : null,
      calories: form.calories ? parseInt(form.calories) : null,
      isVegetarian: form.isVegetarian,
      isSpicy: form.isSpicy,
      imageUrl: form.imageUrl || null,
    };

    if (editingId) {
      updateProduct.mutate({ id: editingId, data }, {
        onSuccess: () => { invalidate(); setShowForm(false); },
        onError: (err: any) => setFormError(err?.data?.error ?? "Failed to update")
      });
    } else {
      createProduct.mutate({ data: { ...data, tags: [] } }, {
        onSuccess: () => { invalidate(); setShowForm(false); },
        onError: (err: any) => setFormError(err?.data?.error ?? "Failed to create")
      });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this product?")) return;
    deleteProduct.mutate({ id }, { onSuccess: invalidate });
  };

  const F = ({ label, id, children }: { label: string; id: string; children: React.ReactNode }) => (
    <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label>{children}</div>
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">Products</h1><p className="text-muted-foreground text-sm">Manage your menu items</p></div>
          <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Product</Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {showForm && (
          <div className="bg-card border border-card-border rounded-xl p-5">
            <h2 className="font-semibold mb-4">{editingId ? "Edit Product" : "New Product"}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <F label="Name *" id="pname"><Input id="pname" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></F>
              <F label="Category *" id="pcat">
                <select id="pcat" required value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </F>
              <F label="Price (₹) *" id="pprice"><Input id="pprice" type="number" step="0.01" required value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></F>
              <F label="Stock" id="pstock"><Input id="pstock" type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} /></F>
              <div className="col-span-2"><F label="Description" id="pdesc"><Input id="pdesc" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></F></div>
              <div className="col-span-2"><F label="Image URL" id="pimg"><Input id="pimg" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." /></F></div>
              <F label="Prep Time (min)" id="pprep"><Input id="pprep" type="number" value={form.preparationTime} onChange={e => setForm(f => ({ ...f, preparationTime: e.target.value }))} /></F>
              <F label="Calories" id="pcal"><Input id="pcal" type="number" value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} /></F>
              <div className="col-span-2 flex gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.isVegetarian} onChange={e => setForm(f => ({ ...f, isVegetarian: e.target.checked }))} className="rounded" /> Vegetarian</label>
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.isSpicy} onChange={e => setForm(f => ({ ...f, isSpicy: e.target.checked }))} className="rounded" /> Spicy</label>
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.isAvailable} onChange={e => setForm(f => ({ ...f, isAvailable: e.target.checked }))} className="rounded" /> Available</label>
              </div>
              {formError && <p className="col-span-2 text-sm text-destructive">{formError}</p>}
              <div className="col-span-2 flex gap-2">
                <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>{editingId ? "Save Changes" : "Create Product"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}</div>
        ) : (
          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Product</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stock</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded object-cover" /> : <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-sm font-bold">{p.name.charAt(0)}</div>}
                        <div>
                          <p className="font-medium">{p.name}</p>
                          {p.description && <p className="text-xs text-muted-foreground truncate max-w-xs">{p.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.categoryName ?? "-"}</td>
                    <td className="px-4 py-3 font-medium">₹{p.price.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${p.stock < 5 ? "text-destructive" : p.stock < 15 ? "text-yellow-600" : "text-green-600"}`}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.isAvailable ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                        {p.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)} disabled={deleteProduct.isPending}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No products found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
