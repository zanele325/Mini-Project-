// lib/firebase/products.js

import { db } from '@/src/lib/firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where,
  orderBy,
  limit
} from 'firebase/firestore';

// Get all products
export const getAllProducts = async () => {
  try {
    const productsRef = collection(db, 'products');
    const querySnapshot = await getDocs(productsRef);
    
    const products = [];
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

// Get products by culture
export const getProductsByCulture = async (culture) => {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('culture', '==', culture));
    const querySnapshot = await getDocs(q);
    
    const products = [];
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return products;
  } catch (error) {
    console.error('Error fetching products by culture:', error);
    return [];
  }
};

// Get products by occasion
export const getProductsByOccasion = async (occasion) => {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('occasions', 'array-contains', occasion));
    const querySnapshot = await getDocs(q);
    
    const products = [];
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return products;
  } catch (error) {
    console.error('Error fetching products by occasion:', error);
    return [];
  }
};

// Get single product by ID
export const getProductById = async (id) => {
  try {
    const productRef = doc(db, 'products', id);
    const productSnap = await getDoc(productRef);
    
    if (productSnap.exists()) {
      return {
        id: productSnap.id,
        ...productSnap.data()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
};