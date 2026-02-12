"use client";

import { useState, useEffect } from "react";
import { useAuth } from '@/src/Context/AuthContext';
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
// REMOVE THIS IMPORT: import Navigation from "@/src/app/components/Navigation"; 

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    displayName: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    preferences: {
      newsletter: false,
      notifications: true
    }
  });

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/profile');
      return;
    }

    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfile({
            displayName: userData.profile?.displayName || user.email?.split('@')[0] || '',
            phone: userData.profile?.phone || '',
            address: userData.profile?.address || '',
            city: userData.profile?.city || '',
            province: userData.profile?.province || '',
            postalCode: userData.profile?.postalCode || '',
            preferences: {
              newsletter: userData.profile?.preferences?.newsletter || false,
              notifications: userData.profile?.preferences?.notifications !== false
            }
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, router]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfile(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        profile: profile,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        {/* REMOVE THIS: <Navigation /> */}
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* REMOVE THIS: <Navigation /> */}
      <div className="profile-page">
        <div className="container">
          <div className="profile-header">
            <h1>My Profile</h1>
            <p>Manage your account information and preferences</p>
          </div>

          <div className="profile-grid">
            {/* Sidebar */}
            <div className="profile-sidebar">
              <div className="profile-avatar">
                <div className="avatar-placeholder">
                  {profile.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              </div>
              <div className="profile-menu">
                <Link href="/profile" className="profile-menu-item active">
                  <span>👤</span> Profile
                </Link>
                <Link href="/orders" className="profile-menu-item">
                  <span>📦</span> Order History
                </Link>
                <Link href="/wishlist" className="profile-menu-item">
                  <span>♡</span> Wishlist
                </Link>
                <Link href="/settings" className="profile-menu-item">
                  <span>⚙️</span> Settings
                </Link>
              </div>
            </div>

            {/* Main Content */}
            <div className="profile-main">
              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-section">
                  <h2>Personal Information</h2>
                  
                  <div className="form-group">
                    <label htmlFor="displayName">Display Name</label>
                    <input
                      type="text"
                      id="displayName"
                      name="displayName"
                      value={profile.displayName}
                      onChange={handleChange}
                      placeholder="Your name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="disabled-input"
                    />
                    <small>Email cannot be changed</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={profile.phone}
                      onChange={handleChange}
                      placeholder="+27 XX XXX XXXX"
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h2>Shipping Address</h2>
                  
                  <div className="form-group">
                    <label htmlFor="address">Street Address</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={profile.address}
                      onChange={handleChange}
                      placeholder="Street address, P.O. Box"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="city">City</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={profile.city}
                        onChange={handleChange}
                        placeholder="City"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="province">Province</label>
                      <select
                        id="province"
                        name="province"
                        value={profile.province}
                        onChange={handleChange}
                      >
                        <option value="">Select Province</option>
                        <option value="Eastern Cape">Eastern Cape</option>
                        <option value="Free State">Free State</option>
                        <option value="Gauteng">Gauteng</option>
                        <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                        <option value="Limpopo">Limpopo</option>
                        <option value="Mpumalanga">Mpumalanga</option>
                        <option value="Northern Cape">Northern Cape</option>
                        <option value="North West">North West</option>
                        <option value="Western Cape">Western Cape</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="postalCode">Postal Code</label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={profile.postalCode}
                      onChange={handleChange}
                      placeholder="Postal code"
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h2>Preferences</h2>
                  
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="preferences.newsletter"
                        checked={profile.preferences.newsletter}
                        onChange={handleChange}
                      />
                      <span>Subscribe to newsletter</span>
                    </label>
                    <small>Receive updates about new products and cultural insights</small>
                  </div>

                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="preferences.notifications"
                        checked={profile.preferences.notifications}
                        onChange={handleChange}
                      />
                      <span>Enable order notifications</span>
                    </label>
                    <small>Get email updates about your order status</small>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="save-button" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" className="cancel-button" onClick={() => router.back()}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          text-align: center;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #B38B59;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .profile-page {
          padding: 40px 0;
          background: #F8F9FA;
          min-height: calc(100vh - 70px);
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .profile-header {
          margin-bottom: 32px;
        }

        .profile-header h1 {
          font-size: 32px;
          color: #2C3E50;
          margin-bottom: 8px;
        }

        .profile-header p {
          color: #666;
          font-size: 16px;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 32px;
        }

        .profile-sidebar {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          height: fit-content;
        }

        .profile-avatar {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }

        .avatar-placeholder {
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, #2C3E50, #1a2634);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          font-weight: 600;
        }

        .profile-menu {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .profile-menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          color: #2C3E50;
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .profile-menu-item:hover {
          background: #F8F9FA;
        }

        .profile-menu-item.active {
          background: #F8F9FA;
          color: #B38B59;
          font-weight: 500;
        }

        .profile-menu-item span {
          font-size: 18px;
        }

        .profile-main {
          background: white;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .form-section {
          border-bottom: 1px solid #E5E7EB;
          padding-bottom: 32px;
        }

        .form-section:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .form-section h2 {
          font-size: 20px;
          color: #2C3E50;
          margin-bottom: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
          flex: 1;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 600;
          color: #2C3E50;
        }

        .form-group input,
        .form-group select {
          padding: 12px 16px;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 15px;
          transition: all 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #B38B59;
          box-shadow: 0 0 0 3px rgba(179, 139, 89, 0.1);
        }

        .form-group input.disabled-input {
          background: #F8F9FA;
          color: #666;
          cursor: not-allowed;
        }

        .form-group small {
          font-size: 12px;
          color: #666;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .checkbox-group {
          margin-bottom: 16px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-size: 15px;
          color: #2C3E50;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #B38B59;
        }

        .form-actions {
          display: flex;
          gap: 16px;
          justify-content: flex-end;
          margin-top: 16px;
        }

        .save-button {
          background: #B38B59;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .save-button:hover:not(:disabled) {
          background: #9a7647;
        }

        .save-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .cancel-button {
          background: white;
          color: #666;
          padding: 12px 24px;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-button:hover {
          background: #F8F9FA;
          border-color: #999;
        }

        @media (max-width: 768px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }

          .profile-sidebar {
            position: sticky;
            top: 90px;
          }

          .form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .form-actions {
            flex-direction: column;
          }

          .save-button,
          .cancel-button {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}