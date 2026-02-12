// app/shop/page.js
"use client";

import { useState, useEffect } from "react";
import { getAllProducts, getProductsByCulture, getProductsByOccasion } from "@/src/lib/products";
import Link from "next/link";

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCulture, setSelectedCulture] = useState("all");
  const [selectedOccasion, setSelectedOccasion] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Sample data for filters (you can fetch these from Firebase too)
  const cultures = ["Xhosa", "Zulu", "Sotho", "Ndebele", "Tswana", "Venda", "Tsonga", "Pedi"];
  const occasions = ["Wedding", "Umemulo", "Funeral", "Lobola", "Heritage Day", "Initiation", "Coming of Age", "Traditional Ceremony"];
  const categories = ["Clothing", "Jewellery", "Accessories", "Footwear", "Headwear", "Blankets"];

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const productsData = await getAllProducts();
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on selections
  useEffect(() => {
    let result = [...products];

    // Filter by culture
    if (selectedCulture !== "all") {
      result = result.filter(product => 
        product.culture?.toLowerCase() === selectedCulture.toLowerCase()
      );
    }

    // Filter by occasion
    if (selectedOccasion !== "all") {
      result = result.filter(product => 
        product.occasions?.includes(selectedOccasion)
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter(product => 
        product.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(product =>
        product.name?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.culture?.toLowerCase().includes(query)
      );
    }

    setFilteredProducts(result);
  }, [searchQuery, selectedCulture, selectedOccasion, selectedCategory, products]);

  // Handle adding to cart
  const handleAddToCart = (product) => {
    // In a real app, you would add to cart state/context
    alert(`Added "${product.name}" to cart!`);
    console.log("Added to cart:", product);
  };

  // Handle adding to wishlist
  const handleAddToWishlist = (product) => {
    alert(`Added "${product.name}" to wishlist!`);
    console.log("Added to wishlist:", product);
  };

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<span key={i} className="rating-star">★</span>);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<span key={i} className="rating-star">★</span>);
      } else {
        stars.push(<span key={i} className="rating-star">☆</span>);
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="shop-page">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-page">
      <div className="container">
        {/* Header */}
        <div className="shop-header">
          <h1 className="shop-title">Traditional Attire Collection</h1>
          <p className="shop-subtitle">
            Discover authentic, culturally appropriate attire and accessories for every occasion
          </p>
        </div>

        {/* Search Bar */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search for attire, jewellery, or specific cultures..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="search-button">Search</button>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label className="filter-label">Filter by Culture</label>
            <select 
              className="filter-select"
              value={selectedCulture}
              onChange={(e) => setSelectedCulture(e.target.value)}
            >
              <option value="all">All Cultures</option>
              {cultures.map((culture) => (
                <option key={culture} value={culture}>{culture}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Filter by Occasion</label>
            <select 
              className="filter-select"
              value={selectedOccasion}
              onChange={(e) => setSelectedOccasion(e.target.value)}
            >
              <option value="all">All Occasions</option>
              {occasions.map((occasion) => (
                <option key={occasion} value={occasion}>{occasion}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Filter by Category</label>
            <select 
              className="filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div style={{ marginBottom: '32px', color: 'var(--text-medium)' }}>
          Showing {filteredProducts.length} of {products.length} products
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🧵</div>
            <h3 style={{ marginBottom: '16px', color: 'var(--accent-primary)' }}>
              No products found
            </h3>
            <p className="empty-state-text">
              Try adjusting your filters or search term to find what you're looking for.
            </p>
            <button 
              className="search-button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCulture("all");
                setSelectedOccasion("all");
                setSelectedCategory("all");
              }}
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="shop-product-grid">
            {filteredProducts.map((product) => (
              <div key={product.id} className="enhanced-product-card">
                {/* Product Image */}
                <div className="product-image-container">
                  {/* Placeholder image - in real app, use product.imageUrl */}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: product.id % 2 === 0 ? '#E8F4F8' : '#F8F4E8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px'
                  }}>
                    {product.category === 'Jewellery' ? '💎' : 
                     product.category === 'Clothing' ? '👗' : 
                     product.category === 'Footwear' ? '👞' : '🎁'}
                  </div>
                  
                  {/* Badges */}
                  <div className="product-badges">
                    <span className="culture-badge">{product.culture}</span>
                    {product.inStock && <span className="stock-badge">In Stock</span>}
                  </div>

                  {/* Quick View Overlay */}
                  <div className="quick-view-overlay">
                    <div className="quick-view-content">
                      <h4>Quick Details</h4>
                      <ul className="quick-view-features">
                        {product.features?.slice(0, 3).map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                      <button className="quick-view-button">View Details</button>
                    </div>
                  </div>
                </div>

                {/* Product Content */}
                <div className="product-content">
                  {/* Occasion Tags */}
                  <div className="occasion-tags">
                    {product.occasions?.slice(0, 3).map((occasion, index) => (
                      <span key={index} className="occasion-tag">{occasion}</span>
                    ))}
                    {product.occasions?.length > 3 && (
                      <span className="occasion-tag">+{product.occasions.length - 3}</span>
                    )}
                  </div>

                  {/* Product Header with Name and Price */}
                  <div className="product-header">
                    <h3 className="product-name">{product.name}</h3>
                    <div className="product-price">R {product.price?.toFixed(2)}</div>
                  </div>

                  {/* Product Description */}
                  <p className="product-description">
                    {product.description || "Traditional attire with cultural significance"}
                  </p>

                  {/* Features */}
                  <div className="product-features">
                    {product.materials?.slice(0, 2).map((material, index) => (
                      <span key={index} className="feature-tag">{material}</span>
                    ))}
                    {product.features?.slice(0, 1).map((feature, index) => (
                      <span key={index} className="feature-tag">{feature}</span>
                    ))}
                  </div>

                  {/* Meta Information and Actions */}
                  <div className="product-meta">
                    {/* Rating */}
                    <div className="product-rating">
                      <div className="rating-stars">
                        {renderStars(product.rating || 4.5)}
                      </div>
                      <span className="rating-count">
                        ({product.reviewCount || 0})
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="product-actions">
                      <button 
                        className="wishlist-button"
                        onClick={() => handleAddToWishlist(product)}
                        title="Add to wishlist"
                      >
                        ♡
                      </button>
                      <button 
                        className="add-to-cart-button"
                        onClick={() => handleAddToCart(product)}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}