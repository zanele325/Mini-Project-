// app/about/page.js
export default function AboutPage() {
  return (
    <div className="page-container">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">About iSiko Studio</h1>
          <p className="page-subtitle">
            Our mission to provide culturally respectful traditional attire
          </p>
        </div>
        
        <div className="content-placeholder">
          <div className="placeholder-icon">🏛️</div>
          <h2>Page Under Development</h2>
          <p>This page will tell our story and explain our commitment to cultural authenticity and respect.</p>
          <a href="/" className="back-link">← Back to Home</a>
        </div>
      </div>
    </div>
  );
}