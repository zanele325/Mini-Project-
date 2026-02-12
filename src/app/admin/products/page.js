"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from '@/src/Context/AuthContext';
import { useRole } from '@/src/hooks/useRole';
import { db } from '@/src/lib/firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore';

export default function AdminProductsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  
  // ✅ FIX: Add mounted state to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCulture, setSelectedCulture] = useState("all");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    salePrice: '',
    category: 'Clothing',
    culture: '',
    occasions: [],
    materials: [],
    features: [],
    tags: [],
    inStock: true,
    stockCount: 0,
    imageUrl: ''
  });

  // Form input state
  const [occasionInput, setOccasionInput] = useState('');
  const [materialInput, setMaterialInput] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  // ✅ FIX: Set mounted to true after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Categories and cultures
  const categories = ["Clothing", "Jewellery", "Accessories", "Footwear", "Headwear", "Blankets"];
  const cultures = ["Xhosa", "Zulu", "Sotho", "Ndebele", "Tswana", "Venda", "Tsonga", "Pedi"];

  // ✅ FIX: Redirect non-admins only after mounted
  useEffect(() => {
    if (mounted && !roleLoading) {
      if (!isAdmin) {
        router.push('/');
      }
    }
  }, [isAdmin, roleLoading, router, mounted]);

  // ✅ FIX: Fetch products only after mounted
  useEffect(() => {
    if (mounted) {
      fetchProducts();
    }
  }, [mounted]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsQuery = query(
        collection(db, "products"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(productsQuery);
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter products
  useEffect(() => {
    if (!mounted) return;
    
    let result = [...products];

    if (selectedCategory !== "all") {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (selectedCulture !== "all") {
      result = result.filter(p => p.culture === selectedCulture);
    }

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.culture?.toLowerCase().includes(query) ||
        p.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredProducts(result);
  }, [searchQuery, selectedCategory, selectedCulture, products, mounted]);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Add array items
  const handleAddOccasion = () => {
    if (occasionInput.trim() && !formData.occasions.includes(occasionInput.trim())) {
      setFormData(prev => ({
        ...prev,
        occasions: [...prev.occasions, occasionInput.trim()]
      }));
      setOccasionInput('');
    }
  };

  const handleAddMaterial = () => {
    if (materialInput.trim() && !formData.materials.includes(materialInput.trim())) {
      setFormData(prev => ({
        ...prev,
        materials: [...prev.materials, materialInput.trim()]
      }));
      setMaterialInput('');
    }
  };

  const handleAddFeature = () => {
    if (featureInput.trim() && !formData.features.includes(featureInput.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, featureInput.trim()]
      }));
      setFeatureInput('');
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  // Remove array items
  const handleRemoveOccasion = (item) => {
    setFormData(prev => ({
      ...prev,
      occasions: prev.occasions.filter(i => i !== item)
    }));
  };

  const handleRemoveMaterial = (item) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter(i => i !== item)
    }));
  };

  const handleRemoveFeature = (item) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(i => i !== item)
    }));
  };

  const handleRemoveTag = (item) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(i => i !== item)
    }));
  };

  // Open modal for add/edit
  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        salePrice: product.salePrice?.toString() || '',
        category: product.category || 'Clothing',
        culture: product.culture || '',
        occasions: product.occasions || [],
        materials: product.materials || [],
        features: product.features || [],
        tags: product.tags || [],
        inStock: product.inStock !== false,
        stockCount: product.stockCount || 0,
        imageUrl: product.imageUrl || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        salePrice: '',
        category: 'Clothing',
        culture: '',
        occasions: [],
        materials: [],
        features: [],
        tags: [],
        inStock: true,
        stockCount: 0,
        imageUrl: ''
      });
    }
    setIsModalOpen(true);
  };

  // Save product
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const productData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
        stockCount: parseInt(formData.stockCount) || 0,
        updatedAt: new Date().toISOString()
      };

      if (editingProduct) {
        // Update existing product
        const productRef = doc(db, 'products', editingProduct.id);
        await updateDoc(productRef, productData);
        alert('Product updated successfully!');
      } else {
        // Add new product
        productData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'products'), productData);
        alert('Product added successfully!');
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async () => {
    if (!deleteConfirm) return;

    try {
      setLoading(true);
      await deleteDoc(doc(db, 'products', deleteConfirm));
      alert('Product deleted successfully!');
      setDeleteConfirm(null);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Duplicate product
  const handleDuplicateProduct = async (product) => {
    try {
      setLoading(true);
      
      const { id, createdAt, ...productData } = product;
      const newProduct = {
        ...productData,
        name: `${product.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'products'), newProduct);
      alert('Product duplicated successfully!');
      fetchProducts();
    } catch (error) {
      console.error('Error duplicating product:', error);
      alert('Failed to duplicate product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get product emoji
  const getProductEmoji = (category) => {
    if (category === "Jewellery") return "💎";
    if (category === "Clothing") return "👗";
    if (category === "Headwear") return "👑";
    if (category === "Accessories") return "👜";
    if (category === "Footwear") return "👞";
    return "🎁";
  };

  // ✅ FIX: Don't render anything until after hydration
  if (!mounted) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading admin panel...</p>
        <style jsx>{`
          .admin-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #F8FAFC;
          }
          .loading-spinner {
            width: 48px;
            height: 48px;
            border: 3px solid #E2E8F0;
            border-top-color: #3182CE;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          p {
            color: #64748B;
            font-size: 16px;
          }
        `}</style>
      </div>
    );
  }

  if (roleLoading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading your permissions...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="admin-products-page">
      <div className="admin-container">
        {/* Header */}
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Products</h1>
            <p className="admin-subtitle">Manage your product inventory</p>
          </div>
          <button 
            className="add-product-btn"
            onClick={() => handleOpenModal()}
          >
            <span className="btn-icon">+</span>
            Add New Product
          </button>
        </div>

        {/* Filters */}
        <div className="admin-filters">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <select 
              className="filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select 
              className="filter-select"
              value={selectedCulture}
              onChange={(e) => setSelectedCulture(e.target.value)}
            >
              <option value="all">All Cultures</option>
              {cultures.map(culture => (
                <option key={culture} value={culture}>{culture}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="admin-stats">
          <div className="stat-card">
            <span className="stat-value">{products.length}</span>
            <span className="stat-label">Total Products</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {products.filter(p => p.inStock).length}
            </span>
            <span className="stat-label">In Stock</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {products.filter(p => p.salePrice).length}
            </span>
            <span className="stat-label">On Sale</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {cultures.filter(c => products.some(p => p.culture === c)).length}
            </span>
            <span className="stat-label">Cultures</span>
          </div>
        </div>

        {/* Products Table */}
        <div className="products-table-container">
          {loading ? (
            <div className="table-loading">
              <div className="loading-spinner"></div>
              <p>Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>No products found</h3>
              <p>Try adjusting your filters or add a new product.</p>
            </div>
          ) : (
            <table className="products-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Culture</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Tags</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={`product-${product.id}`}>
                    <td className="product-cell">
                      <div className="product-info">
                        <div className="product-emoji">
                          {getProductEmoji(product.category)}
                        </div>
                        <div>
                          <div className="product-name">{product.name}</div>
                          <div className="product-description">
                            {product.description?.substring(0, 50)}
                            {product.description?.length > 50 ? '...' : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="category-badge">
                        {product.category}
                      </span>
                    </td>
                    <td>
                      <span className="culture-badge">
                        {product.culture || '—'}
                      </span>
                    </td>
                    <td>
                      <div className="price-cell">
                        {product.salePrice ? (
                          <>
                            <span className="sale-price">
                              R {product.salePrice.toFixed(2)}
                            </span>
                            <span className="original-price">
                              R {product.price.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span>R {product.price?.toFixed(2)}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`stock-badge ${product.inStock ? 'in-stock' : 'out-of-stock'}`}>
                        {product.inStock ? `${product.stockCount || 'In'} Stock` : 'Out of Stock'}
                      </span>
                    </td>
                    <td>
                      <div className="tags-container">
                        {product.tags?.slice(0, 2).map(tag => (
                          <span key={`${product.id}-tag-${tag}`} className="tag">#{tag}</span>
                        ))}
                        {product.tags?.length > 2 && (
                          <span className="tag-more">+{product.tags.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn edit"
                          onClick={() => handleOpenModal(product)}
                          title="Edit product"
                        >
                          ✏️
                        </button>
                        <button 
                          className="action-btn duplicate"
                          onClick={() => handleDuplicateProduct(product)}
                          title="Duplicate product"
                        >
                          📋
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={() => setDeleteConfirm(product.id)}
                          title="Delete product"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button 
                className="close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="modal-form">
              <div className="form-grid">
                {/* Basic Info */}
                <div className="form-section">
                  <h3>Basic Information</h3>
                  
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Xhosa Beaded Necklace"
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Describe the product, its cultural significance, etc."
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Price (R) *</label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="form-group">
                      <label>Sale Price (R)</label>
                      <input
                        type="number"
                        name="salePrice"
                        value={formData.salePrice}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div className="form-section">
                  <h3>Classification</h3>
                  
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Culture</label>
                    <select
                      name="culture"
                      value={formData.culture}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Culture</option>
                      {cultures.map(culture => (
                        <option key={culture} value={culture}>{culture}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Occasions */}
                <div className="form-section">
                  <h3>Occasions</h3>
                  
                  <div className="array-input-group">
                    <div className="array-input">
                      <input
                        type="text"
                        value={occasionInput}
                        onChange={(e) => setOccasionInput(e.target.value)}
                        placeholder="e.g. Wedding, Umemulo..."
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOccasion())}
                      />
                      <button 
                        type="button" 
                        onClick={handleAddOccasion}
                        className="add-btn"
                      >
                        Add
                      </button>
                    </div>
                    
                    <div className="array-items">
                      {formData.occasions.map((item) => (
                        <span key={`occasion-${item}`} className="array-item">
                          {item}
                          <button 
                            type="button"
                            onClick={() => handleRemoveOccasion(item)}
                            className="remove-item"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Materials */}
                <div className="form-section">
                  <h3>Materials</h3>
                  
                  <div className="array-input-group">
                    <div className="array-input">
                      <input
                        type="text"
                        value={materialInput}
                        onChange={(e) => setMaterialInput(e.target.value)}
                        placeholder="e.g. Beads, Fabric, Leather..."
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMaterial())}
                      />
                      <button 
                        type="button" 
                        onClick={handleAddMaterial}
                        className="add-btn"
                      >
                        Add
                      </button>
                    </div>
                    
                    <div className="array-items">
                      {formData.materials.map((item) => (
                        <span key={`material-${item}`} className="array-item">
                          {item}
                          <button 
                            type="button"
                            onClick={() => handleRemoveMaterial(item)}
                            className="remove-item"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="form-section">
                  <h3>Features</h3>
                  
                  <div className="array-input-group">
                    <div className="array-input">
                      <input
                        type="text"
                        value={featureInput}
                        onChange={(e) => setFeatureInput(e.target.value)}
                        placeholder="e.g. Handmade, Adjustable..."
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                      />
                      <button 
                        type="button" 
                        onClick={handleAddFeature}
                        className="add-btn"
                      >
                        Add
                      </button>
                    </div>
                    
                    <div className="array-items">
                      {formData.features.map((item) => (
                        <span key={`feature-${item}`} className="array-item">
                          {item}
                          <button 
                            type="button"
                            onClick={() => handleRemoveFeature(item)}
                            className="remove-item"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tags - Free hand entry */}
                <div className="form-section">
                  <h3>Tags</h3>
                  <p className="field-note">Enter any keywords to help customers find this product</p>
                  
                  <div className="array-input-group">
                    <div className="array-input">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="e.g. traditional, beaded, ceremony..."
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      />
                      <button 
                        type="button" 
                        onClick={handleAddTag}
                        className="add-btn"
                      >
                        Add Tag
                      </button>
                    </div>
                    
                    <div className="array-items tags">
                      {formData.tags.map((tag) => (
                        <span key={`tag-${tag}`} className="tag-item">
                          #{tag}
                          <button 
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="remove-tag"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Inventory */}
                <div className="form-section">
                  <h3>Inventory</h3>
                  
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="inStock"
                        checked={formData.inStock}
                        onChange={handleInputChange}
                      />
                      In Stock
                    </label>
                  </div>

                  <div className="form-group">
                    <label>Stock Count</label>
                    <input
                      type="number"
                      name="stockCount"
                      value={formData.stockCount}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="save-btn"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">⚠️</div>
            <h3>Delete Product</h3>
            <p>Are you sure you want to delete this product? This action cannot be undone.</p>
            <div className="confirm-actions">
              <button 
                className="cancel-btn"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button 
                className="delete-btn"
                onClick={handleDeleteProduct}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-products-page {
          background: #F8FAFC;
          min-height: 100vh;
          padding: 40px 20px;
        }

        .admin-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        /* Header */
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .admin-title {
          font-size: 32px;
          font-weight: 700;
          color: #1A2B3C;
          margin-bottom: 8px;
        }

        .admin-subtitle {
          color: #64748B;
          font-size: 16px;
        }

        .add-product-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: #3182CE;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-product-btn:hover {
          background: #1E4E8C;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(49, 130, 206, 0.2);
        }

        .btn-icon {
          font-size: 20px;
        }

        /* Filters */
        .admin-filters {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          gap: 20px;
        }

        .search-box {
          flex: 1;
          display: flex;
          align-items: center;
          background: white;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 0 16px;
          transition: all 0.2s;
        }

        .search-box:focus-within {
          border-color: #3182CE;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
        }

        .search-icon {
          color: #94A3B8;
          font-size: 18px;
        }

        .search-input {
          flex: 1;
          padding: 14px 16px;
          border: none;
          font-size: 15px;
          background: transparent;
        }

        .search-input:focus {
          outline: none;
        }

        .filter-group {
          display: flex;
          gap: 12px;
        }

        .filter-select {
          padding: 14px 20px;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          font-size: 14px;
          color: #1A2B3C;
          background: white;
          cursor: pointer;
          min-width: 160px;
        }

        .filter-select:focus {
          outline: none;
          border-color: #3182CE;
        }

        /* Stats */
        .admin-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          padding: 24px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: #1A2B3C;
          margin-bottom: 8px;
        }

        .stat-label {
          color: #64748B;
          font-size: 14px;
        }

        /* Products Table */
        .products-table-container {
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.02);
        }

        .table-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid #E2E8F0;
          border-top-color: #3182CE;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .products-table {
          width: 100%;
          border-collapse: collapse;
        }

        .products-table th {
          text-align: left;
          padding: 16px;
          color: #64748B;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #EDF2F7;
        }

        .products-table td {
          padding: 20px 16px;
          border-bottom: 1px solid #EDF2F7;
          color: #1A2B3C;
        }

        .products-table tr:last-child td {
          border-bottom: none;
        }

        .product-cell {
          max-width: 300px;
        }

        .product-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .product-emoji {
          width: 48px;
          height: 48px;
          background: #F1F5F9;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .product-name {
          font-weight: 600;
          color: #1A2B3C;
          margin-bottom: 4px;
        }

        .product-description {
          font-size: 12px;
          color: #64748B;
        }

        .category-badge,
        .culture-badge {
          display: inline-block;
          padding: 6px 12px;
          background: #F1F5F9;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          color: #475569;
        }

        .price-cell {
          display: flex;
          flex-direction: column;
        }

        .sale-price {
          color: #E53E3E;
          font-weight: 600;
        }

        .original-price {
          font-size: 12px;
          color: #94A3B8;
          text-decoration: line-through;
        }

        .stock-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .stock-badge.in-stock {
          background: #F0FDF4;
          color: #2E7D32;
        }

        .stock-badge.out-of-stock {
          background: #FEF2F2;
          color: #E53E3E;
        }

        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tag {
          background: #F1F5F9;
          color: #475569;
          padding: 4px 10px;
          border-radius: 16px;
          font-size: 11px;
        }

        .tag-more {
          color: #64748B;
          font-size: 11px;
          padding: 4px 8px;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          width: 36px;
          height: 36px;
          border: 1px solid #E2E8F0;
          background: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 16px;
        }

        .action-btn.edit:hover {
          background: #EBF8FF;
          border-color: #3182CE;
        }

        .action-btn.duplicate:hover {
          background: #F0FDF4;
          border-color: #2E7D32;
        }

        .action-btn.delete:hover {
          background: #FEF2F2;
          border-color: #E53E3E;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-icon {
          font-size: 64px;
          color: #94A3B8;
          margin-bottom: 24px;
        }

        .empty-state h3 {
          font-size: 20px;
          color: #1A2B3C;
          margin-bottom: 12px;
        }

        .empty-state p {
          color: #64748B;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: white;
          border-radius: 24px;
          width: 90%;
          max-width: 900px;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 28px;
          border-bottom: 1px solid #EDF2F7;
          position: sticky;
          top: 0;
          background: white;
          z-index: 10;
        }

        .modal-header h2 {
          font-size: 24px;
          font-weight: 700;
          color: #1A2B3C;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 20px;
          color: #94A3B8;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #F1F5F9;
          color: #1A2B3C;
        }

        .modal-form {
          padding: 28px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 28px;
          margin-bottom: 28px;
        }

        .form-section {
          background: #F8FAFC;
          padding: 20px;
          border-radius: 16px;
        }

        .form-section h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1A2B3C;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #E2E8F0;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 600;
          color: #1A2B3C;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 12px 16px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3182CE;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-weight: 400;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #3182CE;
        }

        .field-note {
          font-size: 12px;
          color: #64748B;
          margin-bottom: 12px;
        }

        /* Array Inputs */
        .array-input-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .array-input {
          display: flex;
          gap: 12px;
        }

        .array-input input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 14px;
        }

        .add-btn {
          padding: 10px 20px;
          background: white;
          border: 1px solid #3182CE;
          color: #3182CE;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-btn:hover {
          background: #3182CE;
          color: white;
        }

        .array-items {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .array-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: white;
          border: 1px solid #E2E8F0;
          border-radius: 20px;
          font-size: 13px;
          color: #1A2B3C;
        }

        .remove-item {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 2px;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .remove-item:hover {
          color: #E53E3E;
        }

        .tag-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: #EBF8FF;
          color: #3182CE;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
        }

        .remove-tag {
          background: none;
          border: none;
          color: #3182CE;
          cursor: pointer;
          padding: 2px;
          font-size: 14px;
          opacity: 0.7;
        }

        .remove-tag:hover {
          opacity: 1;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 16px;
          padding-top: 24px;
          border-top: 1px solid #EDF2F7;
        }

        .cancel-btn {
          padding: 12px 24px;
          background: white;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          color: #64748B;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-btn:hover {
          background: #F1F5F9;
          border-color: #94A3B8;
        }

        .save-btn {
          padding: 12px 32px;
          background: #3182CE;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .save-btn:hover:not(:disabled) {
          background: #1E4E8C;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(49, 130, 206, 0.2);
        }

        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Confirm Modal */
        .confirm-modal {
          background: white;
          border-radius: 24px;
          padding: 32px;
          max-width: 400px;
          text-align: center;
          animation: slideUp 0.3s ease;
        }

        .confirm-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .confirm-modal h3 {
          font-size: 20px;
          font-weight: 700;
          color: #1A2B3C;
          margin-bottom: 12px;
        }

        .confirm-modal p {
          color: #64748B;
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .confirm-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        .delete-btn {
          padding: 12px 32px;
          background: #E53E3E;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .delete-btn:hover:not(:disabled) {
          background: #C53030;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .admin-filters {
            flex-direction: column;
          }

          .filter-group {
            width: 100%;
          }

          .filter-select {
            flex: 1;
          }

          .admin-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .form-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .admin-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
          }

          .add-product-btn {
            width: 100%;
            justify-content: center;
          }

          .filter-group {
            flex-direction: column;
          }

          .products-table {
            display: block;
            overflow-x: auto;
          }

          .modal-content {
            width: 95%;
            margin: 20px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .admin-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}