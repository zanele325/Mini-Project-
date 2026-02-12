"use client";

import { useState, useEffect } from "react";
import { db } from '@/src/lib/firebase';
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useCart } from '@/src/Context/CartContext';
import { useAuth } from '@/src/Context/AuthContext';
import { useRouter } from "next/navigation"; // ADD THIS

export default function Home() {
  const router = useRouter(); // ADD THIS
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredItems, setFeaturedItems] = useState([]);
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [promotionProducts, setPromotionProducts] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [cultures, setCultures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { addToCart, getCartCount } = useCart();
  const { user } = useAuth();
  const cartCount = getCartCount();

  // Fetch data from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all products
        const productsCollection = collection(db, "products");
        const productsQuery = query(
          productsCollection, 
          orderBy("createdAt", "desc")
        );
        
        const productsSnapshot = await getDocs(productsQuery);
        const allProducts = [];
        
        productsSnapshot.forEach((doc) => {
          allProducts.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // Featured products (recently added)
        setFeaturedItems(allProducts.slice(0, 4));
        
        // Top selling products
        const topSelling = allProducts
          .filter(p => p.salesCount > 0)
          .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
          .slice(0, 4);
        setTopSellingProducts(topSelling);
        
        // Products on promotion
        const onPromotion = allProducts.filter(p => p.onPromotion === true).slice(0, 4);
        setPromotionProducts(onPromotion);
        
        // Extract unique occasions
        const allOccasions = new Set();
        allProducts.forEach(product => {
          if (product.occasions && Array.isArray(product.occasions)) {
            product.occasions.forEach(occasion => allOccasions.add(occasion));
          }
        });
        setOccasions(Array.from(allOccasions).slice(0, 5));
        
        // Extract unique cultures
        const allCultures = new Set();
        allProducts.forEach(product => {
          if (product.culture) {
            allCultures.add(product.culture);
          }
        });
        setCultures(Array.from(allCultures).slice(0, 6));
        
      } catch (error) {
        console.error("Error fetching data from Firebase:", error);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ✅ FIX: Handle image upload click
  const handleImageUploadClick = () => {
    // Create a hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    // Handle file selection
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('File size must be less than 5MB');
          return;
        }
        
        // Check file type
        if (!file.type.startsWith('image/')) {
          alert('Please upload an image file');
          return;
        }
        
        // Create a preview URL and store in sessionStorage
        const reader = new FileReader();
        reader.onload = (event) => {
          // Store the image data in sessionStorage
          sessionStorage.setItem('searchImage', event.target.result);
          sessionStorage.setItem('searchImageName', file.name);
          sessionStorage.setItem('searchImageType', file.type);
          
          // Redirect to image search page
          router.push('/image-search');
        };
        reader.readAsDataURL(file);
      }
    };
    
    fileInput.click();
  };

  const handleAddToCart = (item) => {
    addToCart(item);
    
    // Show a simple notification
    const notification = document.createElement('div');
    notification.textContent = `Added "${item.name}" to cart`;
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #2E8B57;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  };

  // Get appropriate emoji based on product category
  const getProductEmoji = (product) => {
    if (product.category === "Jewellery") return "💎";
    if (product.category === "Clothing") return "👗";
    if (product.category === "Headwear") return "👑";
    if (product.category === "Accessories") return "👜";
    if (product.category === "Footwear") return "👞";
    return "🎁";
  };

  // Get color based on culture
  const getCultureColor = (culture) => {
    const colors = {
      'Xhosa': '#E8F4F8',
      'Zulu': '#F8F4E8',
      'Sotho': '#F4F8E8',
      'Ndebele': '#F8E8F4',
      'Tswana': '#E8F8F4',
      'Venda': '#F4E8F8',
      'Tsonga': '#F8F8E8',
      'Pedi': '#E8E8F8'
    };
    return colors[culture] || '#F8F4E8';
  };

  // Get text color based on background
  const getTextColor = (culture) => {
    const colors = {
      'Xhosa': '#2C5C6F',
      'Zulu': '#8B6A3D',
      'Sotho': '#5C6F2C',
      'Ndebele': '#6F2C5C',
      'Tswana': '#2C6F5C',
      'Venda': '#5C2C6F',
      'Tsonga': '#6F5C2C',
      'Pedi': '#2C5C6F'
    };
    return colors[culture] || '#8B6A3D';
  };

  const ProductGrid = ({ products, title, subtitle }) => (
    <section className="products-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>

        {products.length > 0 ? (
          <div className="products-grid">
            {products.map((item) => (
              <div key={item.id} className="product-card">
                <div 
                  className="product-image" 
                  style={{ 
                    backgroundColor: getCultureColor(item.culture),
                    color: getTextColor(item.culture)
                  }}
                >
                  <div style={{ fontSize: '48px' }}>{getProductEmoji(item)}</div>
                  {item.onPromotion && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: '#E74C3C',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      SALE
                    </div>
                  )}
                </div>
                <div className="product-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span className="product-badge">{item.culture || "Traditional"}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {item.occasions && item.occasions.slice(0, 2).map((occasion, idx) => (
                        <span key={idx} style={{ color: '#2E8B57' }} title={`Appropriate for ${occasion}`}>
                          ✓
                        </span>
                      ))}
                    </div>
                  </div>
                  <h4 className="product-name">{item.name || "Traditional Item"}</h4>
                  <p className="product-note">
                    {item.description 
                      ? `${item.description.substring(0, 60)}...`
                      : (item.note || "Culturally significant traditional attire")}
                  </p>
                  <div className="product-footer">
                    <div className="product-price">
                      {item.onPromotion && item.originalPrice && (
                        <span style={{ 
                          textDecoration: 'line-through', 
                          color: '#999', 
                          fontSize: '14px',
                          marginRight: '8px'
                        }}>
                          R {item.originalPrice.toFixed(2)}
                        </span>
                      )}
                      R {item.price ? item.price.toFixed(2) : "0.00"}
                    </div>
                    <button 
                      className="add-cart-button"
                      onClick={() => handleAddToCart(item)}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
            No products available in this category yet.
          </div>
        )}
      </div>
    </section>
  );

  return (
    <>
      {/* Global CSS for animations */}
      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <div className="app">
        {/* Loading State */}
        {loading && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '40px',
            borderRadius: '10px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #B38B59',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p style={{ color: '#2C3E50', fontSize: '18px' }}>Loading products...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div style={{
            backgroundColor: '#fff3cd',
            color: '#856404',
            padding: '15px',
            margin: '20px',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid #ffeaa7'
          }}>
            <p>{error}</p>
            <a 
              href="/admin/products/add" 
              style={{
                color: '#007bff',
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
            >
              Add products to Firebase first
            </a>
          </div>
        )}

        {/* Hero Section */}
        <section className="hero">
          <div className="container">
            <div className="hero-content">
              <h1 className="hero-title">
                Find the right traditional attire — for the right occasion.
              </h1>
              <p className="hero-subtitle">
                Culturally appropriate clothing and jewellery for Southern African ceremonies.
              </p>
              
              <div className="search-box">
                <p className="search-prompt">Tell us about your occasion...</p>
                <textarea 
                  className="search-textarea"
                  placeholder="I'm attending a Xhosa wedding as a guest and need something respectful."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="search-button" onClick={() => window.location.href = `/shop?search=${searchQuery}`}>
                  <span>Find Recommendations</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Entry Points */}
        <section className="entry-section">
          <div className="container">
            <div className="entry-grid">
              {/* Card 1: Browse by Occasion */}
              <div className="entry-card">
                <div className="entry-icon">📅</div>
                <h3 className="entry-title">Browse by Occasion</h3>
                <p className="entry-description">
                  Find attire specifically chosen for different ceremonies and events.
                </p>
                <div className="entry-tags">
                  {occasions.length > 0 ? (
                    occasions.map((occasion) => (
                      <span key={occasion} className="tag">{occasion}</span>
                    ))
                  ) : (
                    <span className="tag">Loading occasions...</span>
                  )}
                </div>
                <a href="/shop?filter=occasion" className="entry-link">
                  Explore occasions →
                </a>
              </div>

              {/* Card 2: Browse by Culture */}
              <div className="entry-card">
                <div className="entry-icon">🌍</div>
                <h3 className="entry-title">Browse by Culture</h3>
                <p className="entry-description">
                  Explore authentic attire and jewellery from specific cultural traditions.
                </p>
                <div className="entry-tags">
                  {cultures.length > 0 ? (
                    cultures.map((culture) => (
                      <span key={culture} className="tag">{culture}</span>
                    ))
                  ) : (
                    <span className="tag">Loading cultures...</span>
                  )}
                </div>
                <a href="/shop?filter=culture" className="entry-link">
                  Explore cultures →
                </a>
              </div>

              {/* ✅ FIXED: Card 3: Image Upload - NOW WORKING */}
              <div className="entry-card">
                <div className="entry-icon">📷</div>
                <h3 className="entry-title">Image Upload Search</h3>
                <p className="entry-description">
                  Have a photo or pattern? Upload an image to find similar attire or jewellery.
                </p>
                <div 
                  className="upload-area"
                  onClick={handleImageUploadClick}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📤</div>
                  <div>Click to upload image</div>
                </div>
                <p className="upload-text">JPG, PNG up to 5MB</p>
              </div>
            </div>
          </div>
        </section>

        {/* Products on Promotion */}
        {promotionProducts.length > 0 && (
          <ProductGrid 
            products={promotionProducts}
            title="Special Offers"
            subtitle="Limited time promotions on authentic traditional attire"
          />
        )}

        {/* Top Selling Products */}
        {topSellingProducts.length > 0 && (
          <ProductGrid 
            products={topSellingProducts}
            title="Popular Choices"
            subtitle="Most loved items by our community"
          />
        )}

        {/* Featured Products */}
        <ProductGrid 
          products={featuredItems}
          title="Recommended for Common Ceremonies"
          subtitle={featuredItems.length > 0 
            ? `Showing ${featuredItems.length} culturally appropriate items for specific events`
            : "Loading featured products..."}
        />

        {/* Trust Section */}
        <section className="trust-section">
          <div className="container">
            <div className="trust-grid">
              <div className="trust-item">
                <div className="trust-icon">🧵</div>
                <h4 className="trust-title">Authentic Design</h4>
                <p className="trust-description">
                  Carefully curated attire and beadwork inspired by real cultural practices and made by authentic artisans.
                </p>
              </div>
              
              <div className="trust-item">
                <div className="trust-icon">🧠</div>
                <h4 className="trust-title">Smart Recommendations</h4>
                <p className="trust-description">
                  Our system helps you choose attire that is culturally appropriate for your specific event and role.
                </p>
              </div>
              
              <div className="trust-item">
                <div className="trust-icon">🤝</div>
                <h4 className="trust-title">Community Focused</h4>
                <p className="trust-description">
                  Supporting local artisans and preserving cultural heritage through ethical commerce.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="container">
            <div className="footer-grid">
              {/* Column 1 */}
              <div>
                <div className="logo" style={{ marginBottom: '24px' }}>
                  <div className="logo-icon">iS</div>
                  <div className="logo-text" style={{ color: 'white' }}>iSiko Studio</div>
                </div>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                  Culturally respectful traditional attire for Southern African ceremonies.
                </p>
                {featuredItems.length > 0 && (
                  <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px', marginTop: '10px' }}>
                    Currently featuring {featuredItems.length} authentic products
                  </p>
                )}
              </div>

              {/* Column 2 */}
              <div>
                <h4 className="footer-column-title">Quick Links</h4>
                <ul className="footer-links">
                  <li><a href="/" className="footer-link">Home</a></li>
                  <li><a href="/shop" className="footer-link">Shop</a></li>
                  <li><a href="/about" className="footer-link">About Us</a></li>
                  <li><a href="/image-search" className="footer-link">Image Search</a></li>
                </ul>
              </div>

              {/* Column 3 */}
              <div>
                <h4 className="footer-column-title">Support</h4>
                <ul className="footer-links">
                  <li><a href="#" className="footer-link">Contact Us</a></li>
                  <li><a href="#" className="footer-link">FAQs</a></li>
                  <li><a href="#" className="footer-link">Shipping & Returns</a></li>
                  <li><a href="#" className="footer-link">Privacy Policy</a></li>
                </ul>
              </div>

              {/* Column 4 */}
              <div>
                <h4 className="footer-column-title">Stay Connected</h4>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', marginBottom: '16px' }}>
                  Subscribe for cultural insights and new arrivals.
                </p>
                <div style={{ display: 'flex' }}>
                  <input 
                    type="email" 
                    placeholder="Your email"
                    className="newsletter-input"
                  />
                  <button className="newsletter-button">→</button>
                </div>
              </div>
            </div>

            <div className="footer-bottom">
              <p>© 2024 iSiko Studio. All rights reserved. "iSiko" means "Culture" in several Southern African languages.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}