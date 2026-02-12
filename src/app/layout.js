import { AuthProvider } from '@/src/Context/AuthContext';
import { CartProvider } from '@/src/Context/CartContext';
import { WishlistProvider } from '@/src/Context/WishlistContext';
import Navigation from '@/src/app/components/Navigation';
import './globals.css';

export const metadata = {
  title: 'iSiko Studio - Traditional Attire',
  description: 'Culturally appropriate clothing and jewellery for Southern African ceremonies',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta 
          name="format-detection" 
          content="telephone=no, date=no, email=no, address=no" 
        />
        {/* ✅ FIX: Prevent browser extensions from modifying the HTML */}
        <meta name="google" content="notranslate" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body suppressHydrationWarning={true}> {/* ✅ FIX: Add suppressHydrationWarning */}
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Navigation />
              <main>{children}</main>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}