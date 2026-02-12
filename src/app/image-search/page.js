"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from '@/src/lib/firebase';
import { collection, getDocs } from "firebase/firestore";
import { useCart } from '@/src/Context/CartContext';
import { useWishlist } from '@/src/Context/WishlistContext';
import { useAuth } from '@/src/Context/AuthContext';

export default function ImageSearchPage() {
  const router = useRouter();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  
  const fileInputRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageName, setImageName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [selectedCulture, setSelectedCulture] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Check for uploaded image from homepage
  useEffect(() => {
    setMounted(true);
    
    // Check if there's an image in sessionStorage
    const storedImage = sessionStorage.getItem('searchImage');
    const storedName = sessionStorage.getItem('searchImageName');
    const storedType = sessionStorage.getItem('searchImageType');
    
    if (storedImage) {
      setImagePreview(storedImage);
      setImageName(storedName || 'uploaded-image.jpg');
      setSelectedImage({
        data: storedImage,
        name: storedName,
        type: storedType
      });
      
      // Clear from sessionStorage
      sessionStorage.removeItem('searchImage');
      sessionStorage.removeItem('searchImageName');
      sessionStorage.removeItem('searchImageType');
      
      // Auto-analyze the image
      setTimeout(() => {
        analyzeImage();
      }, 500);
    }
    
    fetchProducts();
  }, []);

  // Fetch all products for matching
  const fetchProducts = async () => {
    try {
      const productsCollection = collection(db, "products");
      const snapshot = await getDocs(productsCollection);
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllProducts(products);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processImage(file);
    }
  };

  // Handle drag & drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    }
  };

  // Process uploaded image
  const processImage = (file) => {
    setSelectedImage(file);
    setUploadProgress(0);
    setImageName(file.name);
    setResults([]);
    setAnalysisResults(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
    
    // Simulate upload progress
    setUploading(true);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          analyzeImage();
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  // Analyze image and find similar products
  const analyzeImage = () => {
    setAnalyzing(true);
    setSearching(true);
    
    // Simulate AI image analysis
    setTimeout(() => {
      // Extract dominant colors from the image (simulated)
      const dominantColors = extractDominantColors();
      
      // Generate patterns based on image name or random (simulated)
      const patterns = generatePatterns();
      
      // Determine likely category based on colors/patterns
      const category = predictCategory();
      
      // Determine likely culture
      const culture = predictCulture();
      
      // Generate confidence score
      const confidence = 0.75 + (Math.random() * 0.2);
      
      const analysis = {
        dominantColors,
        patterns,
        category,
        culture,
        occasions: predictOccasions(category, culture),
        confidence: parseFloat(confidence.toFixed(2)),
        keywords: generateKeywords(patterns, category, culture)
      };
      
      setAnalysisResults(analysis);
      
      // Find matching products based on analysis
      const matches = findSimilarProducts(analysis);
      setResults(matches);
      setSearching(false);
      setAnalyzing(false);
    }, 2500);
  };

  // Helper functions for image analysis simulation
  const extractDominantColors = () => {
    const colorPalette = [
      "#8B4513", "#D2691E", "#F4A460", // Browns
      "#2C5C6F", "#1E4E8C", "#3182CE", // Blues
      "#8B6A3D", "#B38B59", "#DAA520", // Golds
      "#5C6F2C", "#2E7D32", "#4CAF50", // Greens
      "#8B3A3A", "#E53E3E", "#C53030"  // Reds
    ];
    
    // Return 3-5 random colors
    const count = Math.floor(Math.random() * 3) + 3;
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(colorPalette[Math.floor(Math.random() * colorPalette.length)]);
    }
    return colors;
  };

  const generatePatterns = () => {
    const allPatterns = ["beaded", "geometric", "striped", "floral", "woven", "embroidered", "printed", "solid"];
    const count = Math.floor(Math.random() * 3) + 2;
    const patterns = [];
    for (let i = 0; i < count; i++) {
      const pattern = allPatterns[Math.floor(Math.random() * allPatterns.length)];
      if (!patterns.includes(pattern)) {
        patterns.push(pattern);
      }
    }
    return patterns;
  };

  const predictCategory = () => {
    const categories = ["Clothing", "Jewellery", "Accessories", "Headwear", "Footwear"];
    return categories[Math.floor(Math.random() * categories.length)];
  };

  const predictCulture = () => {
    const cultures = ["Xhosa", "Zulu", "Sotho", "Ndebele", "Tswana", "Venda", "Tsonga", "Pedi"];
    return cultures[Math.floor(Math.random() * cultures.length)];
  };

  const predictOccasions = (category, culture) => {
    const allOccasions = ["Wedding", "Umemulo", "Funeral", "Lobola", "Heritage Day", "Initiation", "Coming of Age"];
    const count = Math.floor(Math.random() * 3) + 2;
    const occasions = [];
    for (let i = 0; i < count; i++) {
      const occasion = allOccasions[Math.floor(Math.random() * allOccasions.length)];
      if (!occasions.includes(occasion)) {
        occasions.push(occasion);
      }
    }
    return occasions;
  };

  const generateKeywords = (patterns, category, culture) => {
    const keywords = [culture, category, ...patterns];
    const extras = ["traditional", "authentic", "handmade", "ceremonial", "cultural"];
    keywords.push(extras[Math.floor(Math.random() * extras.length)]);
    return keywords;
  };

  // Find similar products based on analysis
  const findSimilarProducts = (analysis) => {
    if (allProducts.length === 0) return [];
    
    // Score each product based on similarity
    const scoredProducts = allProducts.map(product => {
      let score = 0;
      
      // Match by category (highest weight)
      if (product.category === analysis.category) {
        score += 0.4;
      }
      
      // Match by culture
      if (product.culture === analysis.culture) {
        score += 0.3;
      } else if (product.culture) {
        score += 0.1;
      }
      
      // Match by patterns/tags
      if (product.tags) {
        analysis.patterns.forEach(pattern => {
          if (product.tags.some(tag => tag.toLowerCase().includes(pattern.toLowerCase()))) {
            score += 0.1;
          }
        });
      }
      
      // Match by occasions
      if (product.occasions) {
        analysis.occasions.forEach(occasion => {
          if (product.occasions.includes(occasion)) {
            score += 0.05;
          }
        });
      }
      
      // Match by keywords
      if (product.description) {
        analysis.keywords.forEach(keyword => {
          if (product.description.toLowerCase().includes(keyword.toLowerCase())) {
            score += 0.05;
          }
        });
      }
      
      return {
        ...product,
        similarityScore: parseFloat(score.toFixed(2)),
        matchReasons: generateMatchReasons(product, analysis)
      };
    });
    
    // Filter products with score > 0.2 and sort by score
    return scoredProducts
      .filter(p => p.similarityScore > 0.2)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 12);
  };

  const generateMatchReasons = (product, analysis) => {
    const reasons = [];
    
    if (product.category === analysis.category) {
      reasons.push(`Same category: ${product.category}`);
    }
    
    if (product.culture === analysis.culture) {
      reasons.push(`Matches ${product.culture} style`);
    }
    
    if (product.tags) {
      analysis.patterns.forEach(pattern => {
        if (product.tags.some(tag => tag.toLowerCase().includes(pattern.toLowerCase()))) {
          reasons.push(`Features ${pattern} pattern`);
        }
      });
    }
    
    return reasons.slice(0, 2);
  };

  // Filter results
  const getFilteredResults = () => {
    let filtered = [...results];
    
    if (activeFilter !== 'all') {
      filtered = filtered.filter(p => p.category === activeFilter);
    }
    
    if (selectedCulture !== 'all') {
      filtered = filtered.filter(p => p.culture === selectedCulture);
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    return filtered;
  };

  // Reset and upload new image
  const handleUploadNew = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageName('');
    setResults([]);
    setAnalysisResults(null);
    setUploadProgress(0);
    setActiveFilter('all');
    
    // Trigger file input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Get product emoji
  const getProductEmoji = (product) => {
    if (product.category === "Jewellery") return "💎";
    if (product.category === "Clothing") return "👗";
    if (product.category === "Headwear") return "👑";
    if (product.category === "Accessories") return "👜";
    if (product.category === "Footwear") return "👞";
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

  // Don't render until mounted
  if (!mounted) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading image search...</p>
      </div>
    );
  }

  const filteredResults = getFilteredResults();
  const categories = ["Clothing", "Jewellery", "Accessories", "Headwear", "Footwear"];
  const cultures = ["Xhosa", "Zulu", "Sotho", "Ndebele", "Tswana", "Venda", "Tsonga", "Pedi"];

  return (
    <div className="image-search-page">
      <div className="container">
        {/* Header */}
        <div className="search-header">
          <h1 className="search-title">Search by Image</h1>
          <p className="search-subtitle">
            Upload a photo of traditional attire, jewellery, or patterns to find similar items
          </p>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {/* Upload Area */}
        {!imagePreview ? (
          <div 
            className={`upload-area ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-icon">📤</div>
            <h3 className="upload-title">Upload an image</h3>
            <p className="upload-text">
              Drag and drop or click to browse
            </p>
            <p className="upload-hint">
              JPG, PNG, GIF • Max 5MB
            </p>
          </div>
        ) : (
          <div className="image-preview-container">
            <div className="image-preview-card">
              <div className="image-preview">
                <img 
                  src={imagePreview} 
                  alt="Uploaded preview"
                  className="preview-img"
                />
              </div>
              
              <div className="preview-info">
                <div className="file-info">
                  <span className="file-icon">🖼️</span>
                  <span className="file-name">{imageName}</span>
                </div>
                
                {uploading && (
                  <div className="upload-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{uploadProgress}%</span>
                  </div>
                )}
                
                {analyzing && (
                  <div className="analyzing">
                    <div className="analyzing-spinner"></div>
                    <span>Analyzing image...</span>
                  </div>
                )}
                
                <button 
                  className="upload-new-btn"
                  onClick={handleUploadNew}
                >
                  Upload New Image
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysisResults && !analyzing && (
          <div className="analysis-results">
            <div className="analysis-header">
              <h2 className="analysis-title">Image Analysis</h2>
              <div className="confidence-badge">
                {Math.round(analysisResults.confidence * 100)}% Match Confidence
              </div>
            </div>
            
            <div className="analysis-grid">
              <div className="analysis-item">
                <span className="analysis-label">Category</span>
                <span className="analysis-value">{analysisResults.category}</span>
              </div>
              <div className="analysis-item">
                <span className="analysis-label">Culture</span>
                <span className="analysis-value">{analysisResults.culture}</span>
              </div>
              <div className="analysis-item">
                <span className="analysis-label">Patterns</span>
                <span className="analysis-value">
                  {analysisResults.patterns.join(', ')}
                </span>
              </div>
              <div className="analysis-item">
                <span className="analysis-label">Colors</span>
                <div className="color-swatch-group">
                  {analysisResults.dominantColors.map((color, i) => (
                    <div 
                      key={i}
                      className="color-swatch"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {results.length > 0 && (
          <div className="results-section">
            <div className="results-header">
              <div>
                <h2 className="results-title">Similar Products</h2>
                <p className="results-count">
                  Found {filteredResults.length} matching products
                </p>
              </div>
              
              <div className="results-filters">
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

            {searching ? (
              <div className="searching-state">
                <div className="searching-spinner"></div>
                <p>Finding similar products...</p>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="no-results">
                <p>No products match your filters. Try adjusting your criteria.</p>
              </div>
            ) : (
              <div className="products-grid">
                {filteredResults.map((product) => (
                  <div key={product.id} className="product-card">
                    <div className="product-image-container">
                      <div 
                        className="product-image"
                        style={{ 
                          backgroundColor: getCultureColor(product.culture)
                        }}
                      >
                        <span className="product-emoji">{getProductEmoji(product)}</span>
                      </div>
                      
                      <div className="product-badges">
                        <span className="culture-badge">{product.culture || 'Traditional'}</span>
                        {product.inStock && (
                          <span className="stock-badge">In Stock</span>
                        )}
                      </div>

                      <div className="similarity-badge">
                        {Math.round(product.similarityScore * 100)}% Match
                      </div>
                    </div>

                    <div className="product-content">
                      <div className="product-header">
                        <h3 className="product-name">{product.name}</h3>
                        <div className="product-price">
                          R {product.price?.toFixed(2)}
                        </div>
                      </div>

                      <p className="product-description">
                        {product.description?.substring(0, 60)}...
                      </p>

                      <div className="match-reasons">
                        {product.matchReasons?.map((reason, i) => (
                          <span key={i} className="match-reason">
                            ✓ {reason}
                          </span>
                        ))}
                      </div>

                      <div className="product-actions">
                        <button 
                          className="wishlist-button"
                          onClick={() => addToWishlist(product)}
                          title="Add to wishlist"
                        >
                          {isInWishlist(product.id) ? '❤️' : '♡'}
                        </button>
                        <button 
                          className="add-to-cart-button"
                          onClick={() => {
                            addToCart(product);
                            alert(`Added "${product.name}" to cart!`);
                          }}
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* No Results State */}
        {!uploading && !analyzing && !searching && imagePreview && results.length === 0 && (
          <div className="no-results-container">
            <div className="no-results-icon">🔍</div>
            <h3 className="no-results-title">No matches found</h3>
            <p className="no-results-text">
              We couldn't find products matching your image. Try uploading a different photo or browse our collection.
            </p>
            <Link href="/shop" className="browse-shop-btn">
              Browse All Products
            </Link>
          </div>
        )}

        {/* Quick Tips */}
        <div className="quick-tips">
          <h3 className="tips-title">📸 Tips for better matches</h3>
          <ul className="tips-list">
            <li>Upload clear, well-lit photos of the item</li>
            <li>Focus on the main piece of attire or jewellery</li>
            <li>Avoid busy backgrounds</li>
            <li>Include traditional patterns and beadwork in frame</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .image-search-page {
          background: #F8FAFC;
          min-height: 100vh;
          padding: 40px 20px 80px;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
        }

        /* Header */
        .search-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .search-title {
          font-size: 36px;
          font-weight: 700;
          color: #1A2B3C;
          margin-bottom: 16px;
        }

        .search-subtitle {
          font-size: 18px;
          color: #64748B;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* Upload Area */
        .upload-area {
          background: white;
          border: 2px dashed #CBD5E0;
          border-radius: 24px;
          padding: 60px 40px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
          max-width: 600px;
          margin: 0 auto;
        }

        .upload-area:hover {
          border-color: #3182CE;
          background: #F0F9FF;
        }

        .upload-area.drag-active {
          border-color: #3182CE;
          background: #EBF8FF;
          transform: scale(1.02);
        }

        .upload-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .upload-title {
          font-size: 24px;
          font-weight: 600;
          color: #1A2B3C;
          margin-bottom: 12px;
        }

        .upload-text {
          color: #64748B;
          margin-bottom: 8px;
        }

        .upload-hint {
          font-size: 14px;
          color: #94A3B8;
        }

        /* Image Preview */
        .image-preview-container {
          max-width: 800px;
          margin: 0 auto 40px;
        }

        .image-preview-card {
          background: white;
          border-radius: 20px;
          padding: 24px;
          display: flex;
          gap: 32px;
          align-items: center;
          box-shadow: 0 4px 16px rgba(0,0,0,0.02);
        }

        .image-preview {
          width: 200px;
          height: 200px;
          border-radius: 12px;
          overflow: hidden;
          background: #F1F5F9;
        }

        .preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .preview-info {
          flex: 1;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding: 12px;
          background: #F8FAFC;
          border-radius: 12px;
        }

        .file-icon {
          font-size: 24px;
        }

        .file-name {
          font-weight: 500;
          color: #1A2B3C;
          word-break: break-word;
        }

        .upload-progress {
          margin-bottom: 20px;
        }

        .progress-bar {
          height: 8px;
          background: #EDF2F7;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: #3182CE;
          transition: width 0.3s;
        }

        .progress-text {
          font-size: 14px;
          color: #64748B;
        }

        .analyzing {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .analyzing-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #E2E8F0;
          border-top-color: #3182CE;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .upload-new-btn {
          padding: 12px 24px;
          background: white;
          border: 1px solid #3182CE;
          color: #3182CE;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .upload-new-btn:hover {
          background: #3182CE;
          color: white;
        }

        /* Analysis Results */
        .analysis-results {
          background: white;
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 48px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.02);
        }

        .analysis-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .analysis-title {
          font-size: 20px;
          font-weight: 700;
          color: #1A2B3C;
        }

        .confidence-badge {
          padding: 8px 16px;
          background: #2E7D32;
          color: white;
          border-radius: 40px;
          font-size: 14px;
          font-weight: 600;
        }

        .analysis-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .analysis-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .analysis-label {
          font-size: 13px;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .analysis-value {
          font-size: 16px;
          font-weight: 600;
          color: #1A2B3C;
        }

        .color-swatch-group {
          display: flex;
          gap: 8px;
        }

        .color-swatch {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          border: 1px solid #EDF2F7;
        }

        /* Results Section */
        .results-section {
          margin-top: 48px;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 32px;
        }

        .results-title {
          font-size: 28px;
          font-weight: 700;
          color: #1A2B3C;
          margin-bottom: 8px;
        }

        .results-count {
          color: #64748B;
        }

        .results-filters {
          display: flex;
          gap: 16px;
        }

        .filter-select {
          padding: 12px 20px;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          font-size: 14px;
          color: #1A2B3C;
          background: white;
          min-width: 160px;
        }

        /* Products Grid */
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 32px;
        }

        .product-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0,0,0,0.02);
          transition: all 0.3s;
        }

        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.06);
        }

        .product-image-container {
          position: relative;
          height: 240px;
        }

        .product-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 64px;
          transition: transform 0.3s;
        }

        .product-card:hover .product-image {
          transform: scale(1.05);
        }

        .product-emoji {
          font-size: 64px;
        }

        .product-badges {
          position: absolute;
          top: 16px;
          left: 16px;
          display: flex;
          gap: 8px;
        }

        .culture-badge {
          background: rgba(49, 130, 206, 0.9);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          backdrop-filter: blur(4px);
        }

        .stock-badge {
          background: rgba(46, 125, 50, 0.9);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          backdrop-filter: blur(4px);
        }

        .similarity-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(49, 130, 206, 0.95);
          color: white;
          padding: 8px 16px;
          border-radius: 40px;
          font-size: 14px;
          font-weight: 700;
          backdrop-filter: blur(4px);
          box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3);
        }

        .product-content {
          padding: 24px;
        }

        .product-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .product-name {
          font-size: 18px;
          font-weight: 600;
          color: #1A2B3C;
          margin: 0;
          flex: 1;
        }

        .product-price {
          font-size: 20px;
          font-weight: 700;
          color: #3182CE;
          margin-left: 16px;
        }

        .product-description {
          color: #64748B;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .match-reasons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
        }

        .match-reason {
          background: #EBF8FF;
          color: #3182CE;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .product-actions {
          display: flex;
          gap: 12px;
        }

        .wishlist-button {
          width: 48px;
          height: 48px;
          border: 1px solid #E2E8F0;
          background: white;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: #94A3B8;
          transition: all 0.2s;
        }

        .wishlist-button:hover {
          border-color: #FC8181;
          color: #E53E3E;
          background: #FEF2F2;
        }

        .add-to-cart-button {
          flex: 1;
          background: #3182CE;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-to-cart-button:hover {
          background: #1E4E8C;
        }

        /* Loading States */
        .loading-state,
        .searching-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
        }

        .loading-spinner,
        .searching-spinner {
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

        /* No Results */
        .no-results-container {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 24px;
          margin-top: 40px;
        }

        .no-results-icon {
          font-size: 64px;
          margin-bottom: 24px;
        }

        .no-results-title {
          font-size: 24px;
          font-weight: 700;
          color: #1A2B3C;
          margin-bottom: 12px;
        }

        .no-results-text {
          color: #64748B;
          margin-bottom: 24px;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        .browse-shop-btn {
          display: inline-block;
          padding: 16px 32px;
          background: #3182CE;
          color: white;
          text-decoration: none;
          border-radius: 40px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .browse-shop-btn:hover {
          background: #1E4E8C;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(49, 130, 206, 0.2);
        }

        .no-results {
          text-align: center;
          padding: 40px;
          color: #64748B;
        }

        /* Quick Tips */
        .quick-tips {
          margin-top: 60px;
          padding: 32px;
          background: white;
          border-radius: 20px;
        }

        .tips-title {
          font-size: 18px;
          font-weight: 600;
          color: #1A2B3C;
          margin-bottom: 20px;
        }

        .tips-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .tips-list li {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #4A5568;
          font-size: 15px;
        }

        .tips-list li::before {
          content: "✓";
          color: #2E7D32;
          font-weight: 700;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .analysis-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .results-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
          }

          .results-filters {
            width: 100%;
          }

          .filter-select {
            flex: 1;
          }
        }

        @media (max-width: 768px) {
          .search-title {
            font-size: 28px;
          }

          .search-subtitle {
            font-size: 16px;
          }

          .image-preview-card {
            flex-direction: column;
            text-align: center;
          }

          .image-preview {
            width: 100%;
            height: auto;
            aspect-ratio: 1;
          }

          .analysis-grid {
            grid-template-columns: 1fr;
          }

          .products-grid {
            grid-template-columns: 1fr;
          }

          .product-actions {
            flex-direction: column;
          }

          .wishlist-button {
            width: 100%;
          }

          .tips-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}