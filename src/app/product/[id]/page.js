"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { db } from '@/src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useCart } from '@/src/Context/CartContext';
import { useWishlist } from '@/src/Context/WishlistContext';
import { useAuth } from '@/src/Context/AuthContext';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const productDoc = await getDoc(doc(db, 'products', id));
      
      if (productDoc.exists()) {
        setProduct({
          id: productDoc.id,
          ...productDoc.data()
        });
      } else {
        setError('Product not found');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    alert(`Added ${quantity} × "${product.name}" to cart!`);
  };

  const handleAddToWishlist = () => {
    addToWishlist(product);
  };

  const handleQuantityChange = (change) => {
    setQuantity(prev => Math.max(1, prev + change));
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

  // Get culture color
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

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="error-state">
            <div className="error-icon">😕</div>
            <h1 className="error-title">Product Not Found</h1>
            <p className="error-text">{error || 'The product you\'re looking for doesn\'t exist.'}</p>
            <Link href="/shop" className="back-to-shop-btn">
              Browse All Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const discount = product.salePrice ? Math.round((1 - product.salePrice / product.price) * 100) : 0;

  return (
    <div className="product-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link href="/" className="breadcrumb-link">Home</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href="/shop" className="breadcrumb-link">Shop</Link>
          <span className="breadcrumb-separator">/</span>
          {product.category && (
              <>
                <Link href={`/shop?category=${product.category}`} className="breadcrumb-link">
                  {product.category}
                </Link>
                <span className="breadcrumb-separator">/</span>
              </>
            )}
          <span className="breadcrumb-current">{product.name}</span>
        </div>

        {/* Product Main */}
        <div className="product-main">
          {/* Image Gallery */}
          <div className="product-gallery">
            <div className="main-image">
              <div 
                className="product-image-placeholder"
                style={{ backgroundColor: getCultureColor(product.culture) }}
              >
                <span className="main-emoji">{getProductEmoji(product.category)}</span>
              </div>
              {product.onPromotion && (
                <div className="sale-badge-large">SALE {discount}% OFF</div>
              )}
              {!product.inStock && (
                <div className="out-of-stock-badge">Out of Stock</div>
              )}
            </div>
            
            {/* Thumbnail images - placeholder for now */}
            {product.images && product.images.length > 0 && (
              <div className="thumbnail-grid">
                {product.images.map((img, index) => (
                  <div 
                    key={`thumb-${index}`}
                    className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={img} alt={`${product.name} ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="product-info">
            {/* Culture & Category */}
            <div className="product-metadata">
              {product.culture && (
                <span className="culture-tag-large">{product.culture}</span>
              )}
              {product.category && (
                <span className="category-tag">{product.category}</span>
              )}
            </div>

            {/* Product Name */}
            <h1 className="product-detail-title">{product.name}</h1>

            {/* Price */}
            <div className="product-detail-price">
              {product.salePrice ? (
                <>
                  <span className="sale-price-large">R {product.salePrice.toFixed(2)}</span>
                  <span className="original-price-large">R {product.price.toFixed(2)}</span>
                  <span className="discount-badge">{discount}% OFF</span>
                </>
              ) : (
                <span className="regular-price">R {product.price?.toFixed(2)}</span>
              )}
            </div>

            {/* Rating */}
            {product.rating && (
              <div className="product-detail-rating">
                <div className="rating-stars-large">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={`star ${star <= Math.floor(product.rating) ? 'filled' : ''}`}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="rating-count-large">
                  {product.rating} ({product.reviewCount || 0} reviews)
                </span>
              </div>
            )}

            {/* Short Description */}
            <p className="product-detail-description">
              {product.description || "This traditional attire piece carries deep cultural significance and is crafted with authentic materials and techniques."}
            </p>

            {/* Occasions */}
            {product.occasions && product.occasions.length > 0 && (
              <div className="occasions-section">
                <h3 className="section-label">Perfect for:</h3>
                <div className="occasion-tags-large">
                  {product.occasions.map((occasion, index) => (
                    <Link 
                      key={`occasion-${index}`} 
                      href={`/shop?occasion=${occasion}`}
                      className="occasion-tag-large"
                    >
                      {occasion}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div className="stock-status">
              {product.inStock ? (
                <div className="in-stock">
                  <span className="stock-indicator">●</span>
                  In Stock — {product.stockCount || 'Available'} units
                </div>
              ) : (
                <div className="out-of-stock">
                  <span className="stock-indicator">●</span>
                  Out of Stock
                </div>
              )}
            </div>

            {/* Quantity Selector */}
            {product.inStock && (
              <div className="quantity-section">
                <h3 className="section-label">Quantity:</h3>
                <div className="quantity-selector">
                  <button 
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <span className="quantity-value">{quantity}</span>
                  <button 
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(1)}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="detail-action-buttons">
              <button 
                className={`detail-wishlist-btn ${inWishlist ? 'active' : ''}`}
                onClick={handleAddToWishlist}
                disabled={!product.inStock}
              >
                <span className="btn-icon">{inWishlist ? '❤️' : '♡'}</span>
                {inWishlist ? 'Saved to Wishlist' : 'Save to Wishlist'}
              </button>
              
              <button 
                className="detail-cart-btn"
                onClick={handleAddToCart}
                disabled={!product.inStock}
              >
                <span className="btn-icon">🛒</span>
                Add to Cart {quantity > 1 ? `(${quantity} items)` : ''}
              </button>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="tags-section">
                <h3 className="section-label">Tags:</h3>
                <div className="tags-list">
                  {product.tags.map((tag, index) => (
                    <Link 
                      key={`tag-${index}`} 
                      href={`/shop?search=${tag}`}
                      className="tag-link"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs Section */}
        <div className="product-tabs">
          <div className="tabs-header">
            <button 
              className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button 
              className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              Product Details
            </button>
            <button 
              className={`tab-btn ${activeTab === 'cultural' ? 'active' : ''}`}
              onClick={() => setActiveTab('cultural')}
            >
              Cultural Significance
            </button>
            <button 
              className={`tab-btn ${activeTab === 'shipping' ? 'active' : ''}`}
              onClick={() => setActiveTab('shipping')}
            >
              Shipping & Returns
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'description' && (
              <div className="description-tab">
                <h3>About this item</h3>
                <p>{product.description || "This traditional attire piece represents the rich cultural heritage of Southern Africa. Each item is carefully crafted by skilled artisans using authentic materials and traditional techniques passed down through generations."}</p>
                {product.longDescription && (
                  <p>{product.longDescription}</p>
                )}
              </div>
            )}

            {activeTab === 'details' && (
              <div className="details-tab">
                <h3>Product Specifications</h3>
                <div className="specs-grid">
                  {product.culture && (
                    <div className="spec-item">
                      <span className="spec-label">Culture:</span>
                      <span className="spec-value">{product.culture}</span>
                    </div>
                  )}
                  {product.category && (
                    <div className="spec-item">
                      <span className="spec-label">Category:</span>
                      <span className="spec-value">{product.category}</span>
                    </div>
                  )}
                  {product.materials && product.materials.length > 0 && (
                    <div className="spec-item">
                      <span className="spec-label">Materials:</span>
                      <span className="spec-value">{product.materials.join(', ')}</span>
                    </div>
                  )}
                  {product.features && product.features.length > 0 && (
                    <div className="spec-item">
                      <span className="spec-label">Features:</span>
                      <span className="spec-value">{product.features.join(', ')}</span>
                    </div>
                  )}
                  {product.dimensions && (
                    <div className="spec-item">
                      <span className="spec-label">Dimensions:</span>
                      <span className="spec-value">{product.dimensions}</span>
                    </div>
                  )}
                  {product.weight && (
                    <div className="spec-item">
                      <span className="spec-label">Weight:</span>
                      <span className="spec-value">{product.weight}</span>
                    </div>
                  )}
                  {product.origin && (
                    <div className="spec-item">
                      <span className="spec-label">Origin:</span>
                      <span className="spec-value">{product.origin}</span>
                    </div>
                  )}
                  {product.artisan && (
                    <div className="spec-item">
                      <span className="spec-label">Artisan:</span>
                      <span className="spec-value">{product.artisan}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'cultural' && (
              <div className="cultural-tab">
                <h3>Cultural Significance</h3>
                <p>{product.culturalSignificance || `This ${product.culture || 'traditional'} piece holds special meaning within ${product.culture || 'its'} culture. It is traditionally worn during ${product.occasions?.join(', ') || 'ceremonial occasions'} and represents ${product.culture ? `${product.culture} heritage` : 'cultural identity'}.`}</p>
                <div className="cultural-note">
                  <span className="note-icon">🌍</span>
                  <div className="note-text">
                    <strong>Respectful appreciation:</strong> We work directly with community artisans to ensure authentic representation and fair compensation.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="shipping-tab">
                <h3>Shipping & Returns</h3>
                <div className="shipping-info">
                  <div className="info-item">
                    <span className="info-icon">🚚</span>
                    <div>
                      <strong>Free Shipping</strong>
                      <p>On orders over R1000 (South Africa only)</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">⏱️</span>
                    <div>
                      <strong>Delivery Time</strong>
                      <p>3-5 business days within South Africa</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">🔄</span>
                    <div>
                      <strong>Returns</strong>
                      <p>30-day return policy. Items must be unused and in original packaging.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products - You can implement this later */}
        {/* <RelatedProducts currentProduct={product} category={product.category} /> */}
      </div>

      <style jsx>{`
        .product-detail-page {
          background: #F8FAFC;
          min-height: 100vh;
          padding: 40px 20px 80px;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
        }

        /* Breadcrumb */
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
          font-size: 14px;
          color: #64748B;
          flex-wrap: wrap;
        }

        .breadcrumb-link {
          color: #3182CE;
          text-decoration: none;
          transition: color 0.2s;
        }

        .breadcrumb-link:hover {
          color: #1E4E8C;
          text-decoration: underline;
        }

        .breadcrumb-separator {
          color: #94A3B8;
        }

        .breadcrumb-current {
          color: #1A2B3C;
          font-weight: 500;
        }

        /* Product Main Layout */
        .product-main {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          margin-bottom: 60px;
          background: white;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }

        /* Gallery */
        .product-gallery {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .main-image {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          background: #F1F5F9;
          border-radius: 20px;
          overflow: hidden;
        }

        .product-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .main-emoji {
          font-size: 120px;
        }

        .sale-badge-large {
          position: absolute;
          top: 20px;
          right: 20px;
          background: #E53E3E;
          color: white;
          padding: 8px 20px;
          border-radius: 40px;
          font-size: 16px;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(229, 62, 62, 0.3);
        }

        .out-of-stock-badge {
          position: absolute;
          top: 20px;
          right: 20px;
          background: #1A2B3C;
          color: white;
          padding: 8px 20px;
          border-radius: 40px;
          font-size: 16px;
          font-weight: 700;
        }

        .thumbnail-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }

        .thumbnail {
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s;
        }

        .thumbnail:hover {
          border-color: #3182CE;
        }

        .thumbnail.active {
          border-color: #3182CE;
        }

        .thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Product Info */
        .product-info {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .product-metadata {
          display: flex;
          gap: 12px;
          margin-bottom: 8px;
        }

        .culture-tag-large {
          background: #3182CE;
          color: white;
          padding: 6px 16px;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 600;
          display: inline-block;
        }

        .category-tag {
          background: #F1F5F9;
          color: #475569;
          padding: 6px 16px;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 600;
          display: inline-block;
        }

        .product-detail-title {
          font-size: 36px;
          font-weight: 700;
          color: #1A2B3C;
          margin: 0;
          line-height: 1.2;
        }

        .product-detail-price {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 8px;
        }

        .regular-price {
          font-size: 32px;
          font-weight: 700;
          color: #1A2B3C;
        }

        .sale-price-large {
          font-size: 32px;
          font-weight: 700;
          color: #E53E3E;
        }

        .original-price-large {
          font-size: 20px;
          color: #94A3B8;
          text-decoration: line-through;
        }

        .discount-badge {
          background: #FEF2F2;
          color: #E53E3E;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }

        .product-detail-rating {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .rating-stars-large {
          display: flex;
          gap: 4px;
        }

        .star {
          font-size: 20px;
          color: #E2E8F0;
        }

        .star.filled {
          color: #FBBF24;
        }

        .rating-count-large {
          color: #64748B;
          font-size: 15px;
        }

        .product-detail-description {
          font-size: 16px;
          line-height: 1.7;
          color: #4A5568;
          margin: 8px 0;
        }

        .section-label {
          font-size: 15px;
          font-weight: 600;
          color: #1A2B3C;
          margin-bottom: 12px;
        }

        .occasions-section {
          margin-top: 8px;
        }

        .occasion-tags-large {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .occasion-tag-large {
          background: #F1F5F9;
          color: #475569;
          padding: 8px 20px;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s;
        }

        .occasion-tag-large:hover {
          background: #3182CE;
          color: white;
        }

        .stock-status {
          margin-top: 8px;
          padding: 16px 0;
          border-top: 1px solid #EDF2F7;
          border-bottom: 1px solid #EDF2F7;
        }

        .in-stock {
          color: #2E7D32;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .out-of-stock {
          color: #E53E3E;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .stock-indicator {
          font-size: 20px;
        }

        .quantity-section {
          margin-top: 8px;
        }

        .quantity-selector {
          display: inline-flex;
          align-items: center;
          gap: 16px;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 8px;
        }

        .quantity-btn {
          width: 40px;
          height: 40px;
          border: none;
          background: white;
          border-radius: 8px;
          font-size: 20px;
          color: #4A5568;
          cursor: pointer;
          transition: all 0.2s;
        }

        .quantity-btn:hover:not(:disabled) {
          background: #F7FAFC;
          color: #3182CE;
        }

        .quantity-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .quantity-value {
          font-size: 18px;
          font-weight: 600;
          color: #1A2B3C;
          min-width: 30px;
          text-align: center;
        }

        .detail-action-buttons {
          display: flex;
          gap: 16px;
          margin-top: 16px;
        }

        .detail-wishlist-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 16px 24px;
          background: white;
          border: 2px solid #E2E8F0;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          color: #4A5568;
          cursor: pointer;
          transition: all 0.2s;
        }

        .detail-wishlist-btn:hover:not(:disabled) {
          border-color: #FC8181;
          color: #E53E3E;
          background: #FEF2F2;
        }

        .detail-wishlist-btn.active {
          background: #FEF2F2;
          border-color: #E53E3E;
          color: #E53E3E;
        }

        .detail-cart-btn {
          flex: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 16px 24px;
          background: #3182CE;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .detail-cart-btn:hover:not(:disabled) {
          background: #1E4E8C;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(49, 130, 206, 0.2);
        }

        .detail-cart-btn:disabled,
        .detail-wishlist-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-icon {
          font-size: 20px;
        }

        .tags-section {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #EDF2F7;
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .tag-link {
          background: #EBF8FF;
          color: #3182CE;
          padding: 6px 16px;
          border-radius: 30px;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.2s;
        }

        .tag-link:hover {
          background: #3182CE;
          color: white;
        }

        /* Tabs Section */
        .product-tabs {
          background: white;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }

        .tabs-header {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid #EDF2F7;
          padding-bottom: 16px;
          margin-bottom: 32px;
        }

        .tab-btn {
          padding: 12px 24px;
          background: none;
          border: none;
          border-radius: 40px;
          font-size: 15px;
          font-weight: 600;
          color: #64748B;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          background: #F7FAFC;
          color: #1A2B3C;
        }

        .tab-btn.active {
          background: #3182CE;
          color: white;
        }

        .tab-content {
          min-height: 200px;
        }

        .tab-content h3 {
          font-size: 20px;
          font-weight: 700;
          color: #1A2B3C;
          margin-bottom: 20px;
        }

        .tab-content p {
          color: #4A5568;
          line-height: 1.7;
          margin-bottom: 16px;
        }

        .specs-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .spec-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .spec-label {
          font-size: 13px;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .spec-value {
          font-size: 16px;
          font-weight: 500;
          color: #1A2B3C;
        }

        .cultural-note {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          background: #F0F9FF;
          padding: 20px;
          border-radius: 16px;
          margin-top: 24px;
        }

        .note-icon {
          font-size: 24px;
        }

        .note-text {
          flex: 1;
        }

        .note-text strong {
          display: block;
          color: #1A2B3C;
          margin-bottom: 4px;
        }

        .note-text p {
          margin: 0;
          color: #475569;
        }

        .shipping-info {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .info-item {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .info-icon {
          font-size: 24px;
        }

        .info-item div {
          flex: 1;
        }

        .info-item strong {
          display: block;
          color: #1A2B3C;
          margin-bottom: 4px;
        }

        .info-item p {
          margin: 0;
          color: #64748B;
        }

        /* Loading State */
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          text-align: center;
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

        /* Error State */
        .error-state {
          max-width: 500px;
          margin: 80px auto;
          text-align: center;
          background: white;
          padding: 60px 40px;
          border-radius: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }

        .error-icon {
          font-size: 64px;
          margin-bottom: 24px;
        }

        .error-title {
          font-size: 28px;
          font-weight: 700;
          color: #1A2B3C;
          margin-bottom: 16px;
        }

        .error-text {
          color: #64748B;
          margin-bottom: 32px;
          line-height: 1.6;
        }

        .back-to-shop-btn {
          display: inline-block;
          padding: 16px 32px;
          background: #3182CE;
          color: white;
          text-decoration: none;
          border-radius: 40px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .back-to-shop-btn:hover {
          background: #1E4E8C;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(49, 130, 206, 0.2);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .product-main {
            grid-template-columns: 1fr;
            gap: 32px;
          }

          .specs-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .product-detail-title {
            font-size: 28px;
          }

          .main-emoji {
            font-size: 80px;
          }

          .tabs-header {
            flex-wrap: wrap;
          }

          .tab-btn {
            flex: 1;
            text-align: center;
          }

          .detail-action-buttons {
            flex-direction: column;
          }

          .product-main,
          .product-tabs {
            padding: 20px;
          }
        }

        @media (max-width: 480px) {
          .product-detail-price {
            flex-wrap: wrap;
          }

          .thumbnail-grid {
            grid-template-columns: repeat(4, 1fr);
          }

          .breadcrumb {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}