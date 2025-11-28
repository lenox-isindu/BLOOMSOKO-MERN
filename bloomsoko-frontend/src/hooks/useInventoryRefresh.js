// hooks/useInventoryRefresh.js
import { useEffect, useState } from 'react';

export const useInventoryRefresh = (productId) => {
    const [inventory, setInventory] = useState(null);
    const [loading, setLoading] = useState(false);

    const refreshInventory = async () => {
        if (!productId) return;
        
        setLoading(true);
        try {
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_BASE_URL}/products/${productId}`);
            if (response.ok) {
                const productData = await response.json();
                setInventory(productData.inventory);
            }
        } catch (error) {
            console.error('Error refreshing inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Listen for inventory update events
        const handleInventoryUpdate = (event) => {
            if (!productId || event.detail.productId === productId) {
                refreshInventory();
            }
        };

        window.addEventListener('inventoryUpdated', handleInventoryUpdate);
        
        // Initial load
        refreshInventory();

        return () => {
            window.removeEventListener('inventoryUpdated', handleInventoryUpdate);
        };
    }, [productId]);

    return { inventory, loading, refreshInventory };
};