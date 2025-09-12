import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Plus, Search, Filter, ChevronDown, ChevronUp, X, Edit, Trash2, Eye, CheckCircle2, CircleAlert, RefreshCw, Save, Palette
} from 'lucide-react';
import { toast } from 'react-toastify';
import apiService from '../../services/api';

const useDebounce = (value, delay=300) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
};

const FilterBar = ({ filters, onChange }) => {
  const [open, setOpen] = useState(false);
  const hasActive = Object.values(filters).some((v) => v !== '' && v !== undefined && v !== null);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Filter className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {hasActive && <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">Active</span>}
        </div>
        <button onClick={() => setOpen(o => !o)} className="p-2 rounded hover:bg-gray-100 text-gray-500">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      {open && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={filters.search}
                onChange={(e)=>onChange('search', e.target.value)}
                placeholder="Name..."
                className="w-full pl-9 pr-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">Status</label>
            <select
              value={filters.is_active}
              onChange={(e)=>onChange('is_active', e.target.value)}
              className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-green-500"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={()=>{ onChange('search',''); onChange('is_active',''); }}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const TypeCard = ({ item, onEdit, onToggleActive, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg border" style={{ background: item.color_code || '#eee' }} />
          <div>
            <div className="text-lg font-semibold">{item.name}</div>
            <div className="text-xs text-gray-500">{item.name_rw || item.name_fr}</div>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full border ${item.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {item.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {item.description && (
        <p className="mt-3 text-sm text-gray-700 line-clamp-3">{item.description}</p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-gray-500">Icon: {item.icon || '—'}</div>
        <div className="flex items-center gap-2">
          <button onClick={() => onEdit(item)} className="p-2 rounded text-green-700 hover:bg-green-50" title="Edit">
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToggleActive(item)}
            className={`p-2 rounded ${item.is_active ? 'text-orange-700 hover:bg-orange-50' : 'text-blue-700 hover:bg-blue-50'}`}
            title={item.is_active ? 'Deactivate' : 'Activate'}
          >
            {item.is_active ? <CircleAlert className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => { if (confirm(`Delete "${item.name}"?`)) onDelete(item.id); }}
            className="p-2 rounded text-red-700 hover:bg-red-50" title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const EditModal = ({ open, initial, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: '',
    name_rw: '',
    name_fr: '',
    description: '',
    description_rw: '',
    description_fr: '',
    icon: '',
    color_code: '#FF0000',
    is_active: true
  });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name || '',
        name_rw: initial?.name_rw || '',
        name_fr: initial?.name_fr || '',
        description: initial?.description || '',
        description_rw: initial?.description_rw || '',
        description_fr: initial?.description_fr || '',
        icon: initial?.icon || '',
        color_code: initial?.color_code || '#FF0000',
        is_active: initial?.is_active ?? true,
      });
    }
  }, [open, initial]);

  if (!open) return null;
  const isEdit = Boolean(initial?.id);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required.');
      return;
    }
    try {
      setSaving(true);
      await onSave(form);
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">{isEdit ? 'Edit Disaster Type' : 'New Disaster Type'}</h2>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Name *</label>
              <input name="name" value={form.name} onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500" required />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Icon (class or URL)</label>
              <input name="icon" value={form.icon} onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500" />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Name (Kinyarwanda)</label>
              <input name="name_rw" value={form.name_rw} onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Name (French)</label>
              <input name="name_fr" value={form.name_fr} onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange}
                rows={3} className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500" />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Description (Kinyarwanda)</label>
              <textarea name="description_rw" value={form.description_rw} onChange={handleChange}
                rows={2} className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Description (French)</label>
              <textarea name="description_fr" value={form.description_fr} onChange={handleChange}
                rows={2} className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500" />
            </div>

            <div>
              <label className="text-sm text-gray-700 mb-1 flex items-center gap-2">
                <Palette className="w-4 h-4" /> Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="color_code"
                  value={form.color_code}
                  onChange={handleChange}
                  className="w-12 h-10 p-0 border rounded"
                />
                <input
                  name="color_code"
                  value={form.color_code}
                  onChange={handleChange}
                  className="flex-1 border rounded px-3 py-2 focus:ring-2 focus:ring-green-500"
                  placeholder="#FF0000"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input id="is_active" type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
              <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 rounded bg-green-600 text-white flex items-center gap-2 disabled:opacity-60">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {initial?.id ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DisasterTypes = () => {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ search: '', is_active: '' });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const debouncedSearch = useDebounce(filters.search, 400);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.is_active !== '') params.is_active = filters.is_active;
      const res = await apiService.getDisasterTypes(params);
      // paginator or array
      setItems(res?.results || res || []);
    } catch (e) {
      toast.error(e?.message || 'Failed to load disaster types');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.is_active]);

  useEffect(() => { load(); }, [load]);

  const onChangeFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }));

  const createNew = () => { setEditing(null); setModalOpen(true); };
  const editItem = (item) => { setEditing(item); setModalOpen(true); };

  const saveItem = async (data) => {
    if (editing?.id) {
      await apiService.updateDisasterType(editing.id, data);
      toast.success('Disaster type updated');
    } else {
      await apiService.createDisasterType(data);
      toast.success('Disaster type created');
    }
    await load();
  };

  const toggleActive = async (item) => {
    if (item.is_active) {
      await apiService.deactivateDisasterType(item.id);
      toast.success('Deactivated');
    } else {
      await apiService.activateDisasterType(item.id);
      toast.success('Activated');
    }
    await load();
  };

  const deleteItem = async (id) => {
    await apiService.deleteDisasterType(id, { hard: false });
    toast.success('Deleted');
    await load();
  };

  const countActive = useMemo(() => items.filter(i => i.is_active).length, [items]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Disaster Types</h1>
            <p className="text-gray-600">{items.length} total • {countActive} active</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={load} className="px-4 py-2 border rounded-lg flex items-center gap-2 bg-white hover:bg-gray-50">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button onClick={createNew} className="px-4 py-2 rounded-lg bg-green-600 text-white flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Disaster Type
            </button>
          </div>
        </div>

        <FilterBar filters={filters} onChange={onChangeFilter} />

        {/* List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {loading ? (
            <div className="flex justify-center py-16 text-gray-600">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-gray-600">No disaster types found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((it) => (
                <TypeCard
                  key={it.id}
                  item={it}
                  onEdit={editItem}
                  onToggleActive={toggleActive}
                  onDelete={deleteItem}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <EditModal
        open={modalOpen}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSave={saveItem}
      />
    </div>
  );
};

export default DisasterTypes;
