"use client";

import { useState, useEffect } from "react";
import { getAllProducts, getProductsByCulture, getProductsByOccasion } from "@/src/lib/products";
import Link from "next/link";
import { useCart } from '@/src/Context/CartContext';
import { useAuth } from '@/src/Context/AuthContext';
import { useWishlist } from '@/src/Context/WishlistContext';
import { db } from '@/src/lib/firebase';
import { doc, setDoc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCulture, setSelectedCulture] = useState("all");
  const [selectedOccasion, setSelectedOccasion] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);

  const { addToCart } = useCart();
  const { user, isGuest } = useAuth();

  // Sample data for filters
  const cultures = ["Xhosa", "Zulu", "Sotho", "Ndebele", "Tswana", "Venda", "Tsonga", "Pedi"];
  const occasions = ["Wedding", "Umemulo", "Funeral", "Lobola", "Heritage Day", "Initiation", "Coming of Age", "Traditional Ceremony"];
  const categories = ["Clothing", "Jewellery", "Accessories", "Footwear", "Headwear", "Blankets"];

  // Fetch wishlist on mount
  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      const wishlistRef = doc(db, 'wishlists', user.uid);
      const wishlistDoc = await getDoc(wishlistRef);
      if (wishlistDoc.exists()) {
        const items = wishlistDoc.data().items || [];
        setWishlistItems(items.map(item => item.id));
        setWishlistCount(items.length);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

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

    if (selectedCulture !== "all") {
      result = result.filter(product => 
        product.culture?.toLowerCase() === selectedCulture.toLowerCase()
      );
    }

    if (selectedOccasion !== "all") {
      result = result.filter(product => 
        product.occasions?.includes(selectedOccasion)
      );
    }

    if (selectedCategory !== "all") {
      result = result.filter(product => 
        product.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

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

  // Handle adding to wishlist - WITH HEART SHADING
  const handleAddToWishlist = async (product) => {
    // Redirect guests to login
    if (!user) {
      alert("Please sign in to add items to your wishlist");
      window.location.href = '/login?redirect=/shop';
      return;
    }

    // Check if item is already in wishlist
    if (wishlistItems.includes(product.id)) {
      alert(`"${product.name}" is already in your wishlist`);
      return;
    }

    try {
      const wishlistRef = doc(db, 'wishlists', user.uid);
      const wishlistDoc = await getDoc(wishlistRef);
      
      // Create wishlist item
      const wishlistItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        salePrice: product.salePrice || null,
        culture: product.culture,
        category: product.category,
        occasions: product.occasions || [],
        description: product.description || '',
        inStock: product.inStock !== false,
        image: product.image || null,
        addedAt: new Date().toISOString()
      };

      if (wishlistDoc.exists()) {
        // Update existing wishlist
        await updateDoc(wishlistRef, {
          items: arrayUnion(wishlistItem)
        });
      } else {
        // Create new wishlist
        await setDoc(wishlistRef, {
          items: [wishlistItem],
          userId: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      // Update local state to shade the heart
      setWishlistItems(prev => [...prev, product.id]);
      setWishlistCount(prev => prev + 1);
      
      alert(`Added "${product.name}" to wishlist!`);
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      alert('Failed to add to wishlist. Please try again.');
    }
  };

  // Handle adding to cart
  const handleAddToCart = (product) => {
    addToCart(product);
    alert(`Added "${product.name}" to cart!`);
  };

  // Check if product is in wishlist
  const isInWishlist = (productId) => {
    return wishlistItems.includes(productId);
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
                  
                  <div className="product-badges">
                    <span className="culture-badge">{product.culture}</span>
                    {product.inStock && <span className="stock-badge">In Stock</span>}
                  </div>

                  <div className="quick-view-overlay">
                    <div className="quick-view-content">
                      <h4>Quick Details</h4>
                      <ul className="quick-view-features">
                        {product.features?.slice(0, 3).map((feature, index) => (
                          <li key={`feature-${product.id}-${index}`}>{feature}</li> 
                        ))}
                      </ul>
                     <Link href={`/product/${product.id}`} className="quick-view-button">
  View Details
</Link>
                    </div>
                  </div>
                </div>

                <div className="product-content">
                  <div className="occasion-tags">
                    {product.occasions?.slice(0, 3).map((occasion, index) => (
                      <span key={`occasion-${product.id}-${index}`} className="occasion-tag">{occasion}</span> 
                    ))}
                    {product.occasions?.length > 3 && (
                      <span className="occasion-tag">+{product.occasions.length - 3}</span>
                    )}
                  </div>

                  <div className="product-header">
                    <h3 className="product-name">{product.name}</h3>
                    <div className="product-price">R {product.price?.toFixed(2)}</div>
                  </div>

                  <p className="product-description">
                    {product.description || "Traditional attire with cultural significance"}
                  </p>

                  <div className="product-features">
                    {product.materials?.slice(0, 2).map((material, index) => (
                      <span key={`material-${product.id}-${index}`} className="feature-tag">{material}</span> 
                    ))}
                    {product.features?.slice(0, 1).map((feature, index) => (
                      <span key={`feature-tag-${product.id}-${index}`} className="feature-tag">{feature}</span> 
                    ))}
                  </div>

                  <div className="product-meta">
                    <div className="product-rating">
                      <div className="rating-stars">
                        {renderStars(product.rating || 4.5)}
                      </div>
                      <span className="rating-count">
                        ({product.reviewCount || 0})
                      </span>
                    </div>

                    <div className="product-actions">
                      <button 
                        className={`wishlist-button ${isInWishlist(product.id) ? 'active' : ''}`}
                        onClick={() => handleAddToWishlist(product)}
                        title={isInWishlist(product.id) ? "In your wishlist" : "Add to wishlist"}
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

      {/* Add this CSS to your existing styles
      <style jsx>{`
        .wishlist-button.active {
          color: #E53E3E;
          background: #FEF2F2;
          border-color: #FC8181;
        }
      `}</style> */}
    </div>
  );
}