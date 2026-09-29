import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api, resolveAssetUrl } from '../../api.js';

export default function AdminGallery() {
  const { token } = useAuth();
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [adventures, setAdventures] = useState([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const [uploadForm, setUploadForm] = useState({
    files: null, title: '', description: '', category: '', adventure_id: '', is_featured: false,
  });

  function load() {
    api.getGallery().then((data) => setImages(data.images)).catch((e) => setError(e.message));
    api.getGalleryCategories().then((data) => setCategories(data.categories)).catch(() => {});
    api.getAdventures().then((data) => setAdventures(data.adventures)).catch(() => {});
  }

  useEffect(() => { load(); }, []);

  async function handleUpload(e) {
    e.preventDefault();
    setError('');
    if (!uploadForm.files || uploadForm.files.length === 0) {
      setError('Choose at least one photo to upload.');
      return;
    }
    const formData = new FormData();
    Array.from(uploadForm.files).forEach((f) => formData.append('photos', f));
    formData.append('title', uploadForm.title);
    formData.append('description', uploadForm.description);
    formData.append('category', uploadForm.category);
    if (uploadForm.adventure_id) formData.append('adventure_id', uploadForm.adventure_id);
    formData.append('is_featured', uploadForm.is_featured ? '1' : '');

    setUploading(true);
    try {
      await api.uploadGalleryPhotos(formData, token);
      setUploadForm({ files: null, title: '', description: '', category: '', adventure_id: '', is_featured: false });
      document.getElementById('gallery-file-input').value = '';
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function updateImage(img, field, value) {
    try {
      await api.updateGalleryImage(img.id, { [field]: value }, token);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(img) {
    if (!confirm(`Delete "${img.title || 'this photo'}"? This cannot be undone.`)) return;
    try {
      await api.deleteGalleryImage(img.id, token);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      {error && <p className="error">{error}</p>}

      <div className="card">
        <h3>Upload Photos</h3>
        <p className="muted small">Upload one or more real Maqka Summit photos (JPG/PNG/WEBP, up to 8MB each).</p>
        <form onSubmit={handleUpload} className="form form-grid">
          <label className="full-width">
            Photo file(s)
            <input
              id="gallery-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => setUploadForm((f) => ({ ...f, files: e.target.files }))}
            />
          </label>
          <label>
            Title {uploadForm.files?.length > 1 ? '(applied to all, numbered)' : ''}
            <input value={uploadForm.title} onChange={(e) => setUploadForm((f) => ({ ...f, title: e.target.value }))} />
          </label>
          <label>
            Category
            <select value={uploadForm.category} onChange={(e) => setUploadForm((f) => ({ ...f, category: e.target.value }))}>
              <option value="">— Select —</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>
            Associate with adventure (optional)
            <select value={uploadForm.adventure_id} onChange={(e) => setUploadForm((f) => ({ ...f, adventure_id: e.target.value }))}>
              <option value="">— None —</option>
              {adventures.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={uploadForm.is_featured} onChange={(e) => setUploadForm((f) => ({ ...f, is_featured: e.target.checked }))} />
            Featured (shown on homepage)
          </label>
          <label className="full-width">
            Description / caption
            <textarea rows={2} value={uploadForm.description} onChange={(e) => setUploadForm((f) => ({ ...f, description: e.target.value }))} />
          </label>
          <div className="form-actions full-width">
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Photo(s)'}
            </button>
          </div>
        </form>
      </div>

      <h3>Gallery ({images.length} photos)</h3>
      <div className="gallery-admin-grid">
        {images.map((img) => (
          <div className="card gallery-admin-item" key={img.id}>
            <img src={resolveAssetUrl(img.image_url)} alt={img.title || 'Gallery photo'} className="card-image" loading="lazy" />
            <input
              defaultValue={img.title || ''}
              placeholder="Title"
              onBlur={(e) => updateImage(img, 'title', e.target.value)}
            />
            <select defaultValue={img.category || ''} onChange={(e) => updateImage(img, 'category', e.target.value)}>
              <option value="">— No category —</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select defaultValue={img.adventure_id || ''} onChange={(e) => updateImage(img, 'adventure_id', e.target.value || null)}>
              <option value="">— No adventure —</option>
              {adventures.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
            <div className="form-row small-form">
              <label className="checkbox-label">
                <input type="checkbox" checked={!!img.is_featured} onChange={(e) => updateImage(img, 'is_featured', e.target.checked)} />
                Featured
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={!!img.is_active} onChange={(e) => updateImage(img, 'is_active', e.target.checked)} />
                Active
              </label>
            </div>
            <div className="form-row small-form">
              <label className="muted small" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Order
                <input
                  type="number"
                  defaultValue={img.sort_order}
                  style={{ width: 60 }}
                  onBlur={(e) => updateImage(img, 'sort_order', Number(e.target.value))}
                />
              </label>
              <button className="btn-link danger" onClick={() => handleDelete(img)}>Delete</button>
            </div>
          </div>
        ))}
        {images.length === 0 && <p>No photos uploaded yet.</p>}
      </div>
    </div>
  );
}
