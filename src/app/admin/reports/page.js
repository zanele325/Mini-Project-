"use client";

import { useState, useEffect } from "react";
import { db } from '@/src/lib/firebase';
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import {
  FileText,
  Download,
  Filter,
  Calendar,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  Globe2,
  Tag,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Printer,
  Mail,
  Search,
  RefreshCw,
} from "lucide-react";

export default function ReportsPage() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Filters
  const [dateRange, setDateRange] = useState("30");
  const [reportType, setReportType] = useState("overview");
  const [selectedCulture, setSelectedCulture] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Report data
  const [reportData, setReportData] = useState({
    summary: {},
    sales: [],
    inventory: [],
    cultural: [],
    performance: [],
  });

  const [cultures, setCultures] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      generateReport();
    }
  }, [dateRange, reportType, selectedCulture, selectedCategory, products, orders]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch products
      const productsRef = collection(db, "products");
      const productsSnapshot = await getDocs(query(productsRef, orderBy("createdAt", "desc")));
      const productsData = [];
      productsSnapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() });
      });
      setProducts(productsData);

      // Extract unique cultures and categories
      const cultSet = new Set();
      const catSet = new Set();
      productsData.forEach((p) => {
        if (p.culture) cultSet.add(p.culture);
        if (p.category) catSet.add(p.category);
      });
      setCultures(Array.from(cultSet));
      setCategories(Array.from(catSet));

      // Fetch orders
      try {
        const ordersRef = collection(db, "orders");
        const ordersSnapshot = await getDocs(query(ordersRef, orderBy("createdAt", "desc")));
        const ordersData = [];
        ordersSnapshot.forEach((doc) => {
          ordersData.push({ id: doc.id, ...doc.data() });
        });
        setOrders(ordersData);
      } catch (e) {
        setOrders([]);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = () => {
    let filteredProducts = [...products];
    let filteredOrders = [...orders];

    // Apply culture filter
    if (selectedCulture !== "all") {
      filteredProducts = filteredProducts.filter((p) => p.culture === selectedCulture);
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filteredProducts = filteredProducts.filter((p) => p.category === selectedCategory);
    }

    // Apply date range filter
    const now = new Date();
    const daysAgo = dateRange === "all" ? Infinity : parseInt(dateRange);
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    filteredOrders = filteredOrders.filter((o) => {
      const orderDate = o.createdAt?.toDate?.() || new Date(0);
      return orderDate >= cutoffDate;
    });

    // Generate report based on type
    const summary = generateSummary(filteredProducts, filteredOrders);
    const sales = generateSalesReport(filteredProducts, filteredOrders);
    const inventory = generateInventoryReport(filteredProducts);
    const cultural = generateCulturalReport(filteredProducts);
    const performance = generatePerformanceReport(filteredProducts);

    setReportData({ summary, sales, inventory, cultural, performance });
  };

  const generateSummary = (prods, ords) => {
    const totalRevenue = ords.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = ords.length;
    const totalProducts = prods.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalSales = prods.reduce((sum, p) => sum + (p.salesCount || 0), 0);
    const lowStock = prods.filter((p) => (p.stock || 0) < 5).length;
    const outOfStock = prods.filter((p) => (p.stock || 0) === 0).length;
    const onPromotion = prods.filter((p) => p.onPromotion).length;

    return {
      totalRevenue,
      totalOrders,
      totalProducts,
      avgOrderValue,
      totalSales,
      lowStock,
      outOfStock,
      onPromotion,
    };
  };

  const generateSalesReport = (prods, ords) => {
    return prods
      .map((p) => ({
        id: p.id,
        name: p.name,
        culture: p.culture || "Various",
        category: p.category || "Uncategorized",
        price: p.price || 0,
        salesCount: p.salesCount || 0,
        revenue: (p.price || 0) * (p.salesCount || 0),
        stock: p.stock || 0,
      }))
      .sort((a, b) => b.salesCount - a.salesCount);
  };

  const generateInventoryReport = (prods) => {
    return prods.map((p) => ({
      id: p.id,
      name: p.name,
      culture: p.culture || "Various",
      category: p.category || "Uncategorized",
      stock: p.stock || 0,
      price: p.price || 0,
      status:
        (p.stock || 0) === 0 ? "Out of Stock" : (p.stock || 0) < 5 ? "Low Stock" : "In Stock",
      onPromotion: p.onPromotion || false,
    }));
  };

  const generateCulturalReport = (prods) => {
    const cultMap = {};
    prods.forEach((p) => {
      const cult = p.culture || "Various";
      if (!cultMap[cult]) {
        cultMap[cult] = { name: cult, count: 0, revenue: 0, sales: 0 };
      }
      cultMap[cult].count++;
      cultMap[cult].sales += p.salesCount || 0;
      cultMap[cult].revenue += (p.price || 0) * (p.salesCount || 0);
    });
    return Object.values(cultMap).sort((a, b) => b.revenue - a.revenue);
  };

  const generatePerformanceReport = (prods) => {
    const catMap = {};
    prods.forEach((p) => {
      const cat = p.category || "Uncategorized";
      if (!catMap[cat]) {
        catMap[cat] = { name: cat, count: 0, revenue: 0, sales: 0, avgPrice: 0 };
      }
      catMap[cat].count++;
      catMap[cat].sales += p.salesCount || 0;
      catMap[cat].revenue += (p.price || 0) * (p.salesCount || 0);
    });
    Object.values(catMap).forEach((cat) => {
      cat.avgPrice = cat.count > 0 ? cat.revenue / cat.sales : 0;
    });
    return Object.values(catMap).sort((a, b) => b.revenue - a.revenue);
  };

  const downloadReport = (format = "csv") => {
    setGenerating(true);
    setTimeout(() => {
      let content = "";
      let filename = `iSiko-${reportType}-report-${new Date().toISOString().split("T")[0]}`;

      if (format === "csv") {
        if (reportType === "sales") {
          content = "Product ID,Name,Culture,Category,Price,Sales,Revenue,Stock\n";
          reportData.sales.forEach((item) => {
            content += `${item.id},${item.name},${item.culture},${item.category},${item.price},${item.salesCount},${item.revenue},${item.stock}\n`;
          });
        } else if (reportType === "inventory") {
          content = "Product ID,Name,Culture,Category,Stock,Price,Status,On Promotion\n";
          reportData.inventory.forEach((item) => {
            content += `${item.id},${item.name},${item.culture},${item.category},${item.stock},${item.price},${item.status},${item.onPromotion}\n`;
          });
        } else if (reportType === "cultural") {
          content = "Culture,Products,Sales,Revenue\n";
          reportData.cultural.forEach((item) => {
            content += `${item.name},${item.count},${item.sales},${item.revenue}\n`;
          });
        } else {
          content = "Metric,Value\n";
          Object.entries(reportData.summary).forEach(([key, value]) => {
            content += `${key},${value}\n`;
          });
        }
        filename += ".csv";
      }

      const blob = new Blob([content], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setGenerating(false);
    }, 500);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700;800&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        
        * { box-sizing: border-box; }
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #F5F5F5;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#F5F5F5" }}>
        {/* Header */}
        <div
          className="no-print"
          style={{
            background: "linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)",
            padding: "40px 32px",
            borderBottom: "4px solid #B38B59",
          }}
        >
          <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  background: "linear-gradient(135deg, #B38B59, #8B6A3D)",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FileText size={28} color="white" />
              </div>
              <div>
                <h1
                  style={{
                    margin: "0 0 4px",
                    fontSize: "38px",
                    fontWeight: "800",
                    color: "white",
                    fontFamily: "'Crimson Pro', serif",
                  }}
                >
                  Reports Dashboard
                </h1>
                <p style={{ margin: 0, fontSize: "15px", color: "rgba(255,255,255,0.7)" }}>
                  Generate, view, and download comprehensive business reports
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ padding: "80px 32px", textAlign: "center" }}>
            <div
              style={{
                width: "60px",
                height: "60px",
                border: "4px solid #f0f0f0",
                borderTop: "4px solid #B38B59",
                borderRadius: "50%",
                margin: "0 auto 24px",
                animation: "spin 1s linear infinite",
              }}
            />
            <p style={{ color: "#999", fontSize: "16px" }}>Loading report data...</p>
          </div>
        )}

        {/* Main Content */}
        {!loading && (
          <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px 32px" }}>
            {/* Filters & Actions */}
            <div
              className="no-print"
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "32px",
                marginBottom: "32px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                border: "1px solid #e0e0e0",
                animation: "slideDown 0.5s ease-out",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                <Filter size={24} color="#B38B59" />
                <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "700", fontFamily: "'Crimson Pro', serif" }}>
                  Report Configuration
                </h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "24px" }}>
                {/* Report Type */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#666", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Report Type
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      border: "2px solid #e0e0e0",
                      fontSize: "15px",
                      fontWeight: "500",
                      cursor: "pointer",
                      background: "white",
                      transition: "border-color 0.2s",
                    }}
                  >
                    <option value="overview">Overview Summary</option>
                    <option value="sales">Sales Report</option>
                    <option value="inventory">Inventory Report</option>
                    <option value="cultural">Cultural Analysis</option>
                    <option value="performance">Category Performance</option>
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#666", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Date Range
                  </label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      border: "2px solid #e0e0e0",
                      fontSize: "15px",
                      fontWeight: "500",
                      cursor: "pointer",
                      background: "white",
                    }}
                  >
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                    <option value="90">Last 90 Days</option>
                    <option value="365">Last Year</option>
                    <option value="all">All Time</option>
                  </select>
                </div>

                {/* Culture Filter */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#666", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Culture
                  </label>
                  <select
                    value={selectedCulture}
                    onChange={(e) => setSelectedCulture(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      border: "2px solid #e0e0e0",
                      fontSize: "15px",
                      fontWeight: "500",
                      cursor: "pointer",
                      background: "white",
                    }}
                  >
                    <option value="all">All Cultures</option>
                    {cultures.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#666", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      border: "2px solid #e0e0e0",
                      fontSize: "15px",
                      fontWeight: "500",
                      cursor: "pointer",
                      background: "white",
                    }}
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  onClick={() => downloadReport("csv")}
                  disabled={generating}
                  style={{
                    padding: "14px 24px",
                    borderRadius: "12px",
                    border: "none",
                    background: "linear-gradient(135deg, #2E8B57, #228B4A)",
                    color: "white",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: generating ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s",
                    opacity: generating ? 0.6 : 1,
                  }}
                >
                  <Download size={18} />
                  {generating ? "Generating..." : "Download CSV"}
                </button>

                <button
                  onClick={printReport}
                  style={{
                    padding: "14px 24px",
                    borderRadius: "12px",
                    border: "2px solid #e0e0e0",
                    background: "white",
                    color: "#666",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s",
                  }}
                >
                  <Printer size={18} />
                  Print Report
                </button>

                <button
                  onClick={fetchData}
                  style={{
                    padding: "14px 24px",
                    borderRadius: "12px",
                    border: "2px solid #e0e0e0",
                    background: "white",
                    color: "#666",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s",
                  }}
                >
                  <RefreshCw size={18} />
                  Refresh Data
                </button>
              </div>
            </div>

            {/* Report Content */}
            <div
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "40px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                border: "1px solid #e0e0e0",
                animation: "fadeIn 0.6s ease-out",
              }}
            >
              {/* Report Header */}
              <div style={{ marginBottom: "40px", paddingBottom: "24px", borderBottom: "2px solid #f0f0f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h2 style={{ margin: "0 0 8px", fontSize: "32px", fontWeight: "800", fontFamily: "'Crimson Pro', serif" }}>
                      {reportType === "overview" && "Business Overview Report"}
                      {reportType === "sales" && "Sales Performance Report"}
                      {reportType === "inventory" && "Inventory Status Report"}
                      {reportType === "cultural" && "Cultural Distribution Report"}
                      {reportType === "performance" && "Category Performance Report"}
                    </h2>
                    <p style={{ margin: 0, fontSize: "15px", color: "#999" }}>
                      Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "700", color: "#B38B59" }}>iSiko Studio</p>
                    <p style={{ margin: 0, fontSize: "13px", color: "#999" }}>Cultural Heritage Shop</p>
                  </div>
                </div>
              </div>

              {/* Overview Report */}
              {reportType === "overview" && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px", marginBottom: "40px" }}>
                    {[
                      { label: "Total Revenue", value: `R ${reportData.summary.totalRevenue?.toLocaleString() || 0}`, icon: DollarSign, color: "#2E8B57" },
                      { label: "Total Orders", value: reportData.summary.totalOrders || 0, icon: ShoppingBag, color: "#B38B59" },
                      { label: "Total Products", value: reportData.summary.totalProducts || 0, icon: Package, color: "#6F2C5C" },
                      { label: "Avg Order Value", value: `R ${reportData.summary.avgOrderValue?.toFixed(0) || 0}`, icon: TrendingUp, color: "#2C5C6F" },
                      { label: "Total Sales", value: reportData.summary.totalSales || 0, icon: Activity, color: "#8B6A3D" },
                      { label: "Low Stock Items", value: reportData.summary.lowStock || 0, icon: AlertCircle, color: "#E74C3C" },
                    ].map((stat, idx) => {
                      const Icon = stat.icon;
                      return (
                        <div key={idx} style={{ padding: "20px", background: "#FAFAFA", borderRadius: "16px", border: "1px solid #f0f0f0" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                            <div style={{ width: "40px", height: "40px", background: `${stat.color}20`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Icon size={20} color={stat.color} />
                            </div>
                            <p style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "#999", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              {stat.label}
                            </p>
                          </div>
                          <p style={{ margin: 0, fontSize: "28px", fontWeight: "800", color: "#1A1A1A", fontFamily: "'Crimson Pro', serif" }}>
                            {stat.value}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sales Report */}
              {reportType === "sales" && (
                <div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#FAFAFA", borderBottom: "2px solid #e0e0e0" }}>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: "13px", fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Product</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: "13px", fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Culture</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: "13px", fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Category</th>
                        <th style={{ padding: "16px", textAlign: "right", fontSize: "13px", fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Price</th>
                        <th style={{ padding: "16px", textAlign: "right", fontSize: "13px", fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Sales</th>
                        <th style={{ padding: "16px", textAlign: "right", fontSize: "13px", fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.sales.slice(0, 20).map((item, idx) => (
                        <tr key={item.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <td style={{ padding: "16px", fontSize: "15px", fontWeight: "600", color: "#1A1A1A" }}>{item.name}</td>
                          <td style={{ padding: "16px", fontSize: "14px", color: "#666" }}>{item.culture}</td>
                          <td style={{ padding: "16px", fontSize: "14px", color: "#666" }}>{item.category}</td>
                          <td style={{ padding: "16px", fontSize: "15px", fontWeight: "600", color: "#1A1A1A", textAlign: "right" }}>R {item.price.toFixed(2)}</td>
                          <td style={{ padding: "16px", fontSize: "15px", fontWeight: "600", color: "#B38B59", textAlign: "right" }}>{item.salesCount}</td>
                          <td style={{ padding: "16px", fontSize: "15px", fontWeight: "700", color: "#2E8B57", textAlign: "right" }}>R {item.revenue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Inventory Report */}
              {reportType === "inventory" && (
                <div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#FAFAFA", borderBottom: "2px solid #e0e0e0" }}>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: "13px", fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Product</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: "13px", fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Culture</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: "13px", fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Category</th>
                        <th style={{ padding: "16px", textAlign: "right", fontSize: "13px", fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Stock</th>
                        <th style={{ padding: "16px", textAlign: "right", fontSize: "13px", fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Price</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: "13px", fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.inventory.map((item, idx) => (
                        <tr key={item.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <td style={{ padding: "16px", fontSize: "15px", fontWeight: "600", color: "#1A1A1A" }}>{item.name}</td>
                          <td style={{ padding: "16px", fontSize: "14px", color: "#666" }}>{item.culture}</td>
                          <td style={{ padding: "16px", fontSize: "14px", color: "#666" }}>{item.category}</td>
                          <td style={{ padding: "16px", fontSize: "15px", fontWeight: "700", color: item.stock === 0 ? "#E74C3C" : item.stock < 5 ? "#F39C12" : "#2E8B57", textAlign: "right" }}>
                            {item.stock}
                          </td>
                          <td style={{ padding: "16px", fontSize: "15px", fontWeight: "600", color: "#1A1A1A", textAlign: "right" }}>R {item.price.toFixed(2)}</td>
                          <td style={{ padding: "16px" }}>
                            <span style={{
                              padding: "6px 12px",
                              borderRadius: "8px",
                              fontSize: "12px",
                              fontWeight: "700",
                              background: item.status === "Out of Stock" ? "#FEE" : item.status === "Low Stock" ? "#FFF3E0" : "#E8F5E9",
                              color: item.status === "Out of Stock" ? "#E74C3C" : item.status === "Low Stock" ? "#F39C12" : "#2E8B57",
                            }}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Cultural Report */}
              {reportType === "cultural" && (
                <div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#FAFAFA", borderBottom: "2px solid #e0e0e0" }}>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: "13px", fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Culture</th>
                        <th style={{ padding: "16px", textAlign: "right", fontSize: "13px", fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Products</th>
                        <th style={{ padding: "16px", textAlign: "right", fontSize: "13px", fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Sales</th>
                        <th style={{ padding: "16px", textAlign: "right", fontSize: "13px", fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.cultural.map((item, idx) => (
                        <tr key={item.name} style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <td style={{ padding: "16px", fontSize: "16px", fontWeight: "700", color: "#1A1A1A" }}>{item.name}</td>
                          <td style={{ padding: "16px", fontSize: "15px", fontWeight: "600", color: "#666", textAlign: "right" }}>{item.count}</td>
                          <td style={{ padding: "16px", fontSize: "15px", fontWeight: "600", color: "#B38B59", textAlign: "right" }}>{item.sales}</td>
                          <td style={{ padding: "16px", fontSize: "16px", fontWeight: "700", color: "#2E8B57", textAlign: "right" }}>R {item.revenue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Performance Report */}
              {reportType === "performance" && (
                <div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#FAFAFA", borderBottom: "2px solid #e0e0e0" }}>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: "13px", fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Category</th>
                        <th style={{ padding: "16px", textAlign: "right", fontSize: "13px", fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Products</th>
                        <th style={{ padding: "16px", textAlign: "right", fontSize: "13px", fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Sales</th>
                        <th style={{ padding: "16px", textAlign: "right", fontSize: "13px", fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Revenue</th>
                        <th style={{ padding: "16px", textAlign: "right", fontSize: "13px", fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Avg Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.performance.map((item, idx) => (
                        <tr key={item.name} style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <td style={{ padding: "16px", fontSize: "16px", fontWeight: "700", color: "#1A1A1A" }}>{item.name}</td>
                          <td style={{ padding: "16px", fontSize: "15px", fontWeight: "600", color: "#666", textAlign: "right" }}>{item.count}</td>
                          <td style={{ padding: "16px", fontSize: "15px", fontWeight: "600", color: "#B38B59", textAlign: "right" }}>{item.sales}</td>
                          <td style={{ padding: "16px", fontSize: "16px", fontWeight: "700", color: "#2E8B57", textAlign: "right" }}>R {item.revenue.toFixed(2)}</td>
                          <td style={{ padding: "16px", fontSize: "15px", fontWeight: "600", color: "#666", textAlign: "right" }}>R {item.avgPrice.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Footer */}
              <div style={{ marginTop: "60px", paddingTop: "24px", borderTop: "2px solid #f0f0f0", textAlign: "center" }}>
                <p style={{ margin: "0 0 8px", fontSize: "14px", color: "#666" }}>
                  This report was automatically generated by iSiko Studio Analytics
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "#999" }}>
                  For questions or support, contact admin@isikostudio.co.za
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}