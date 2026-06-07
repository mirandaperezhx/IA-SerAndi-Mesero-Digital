import { useEffect, useState } from 'react';
import sgpApi from '../lib/supabase';
import type { Order } from '../types';

export function useRealtimeOrders(storeId?: string, activeSessionId?: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial orders
  const refreshOrders = async () => {
    try {
      setLoading(true);
      if (activeSessionId) {
        // Customer side
        const { data, error: err } = await sgpApi.getSessionOrders(activeSessionId);
        if (err) throw new Error(err);
        setOrders(data || []);
      } else if (storeId) {
        // Merchant side
        const { data, error: err } = await sgpApi.getActiveStoreOrders(storeId);
        if (err) throw new Error(err);
        setOrders(data || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshOrders();

    // Subscribe to realtime Broadcast events
    const unsubscribe = sgpApi.subscribeToBroadcast((event, payload) => {
      console.log(`[Realtime Broadcast] Event received: ${event}`, payload);

      if (event === 'order_created') {
        const newOrder = payload as Order;
        
        // If we are looking for store orders or specifically this session
        if (storeId && newOrder.store_id === storeId) {
          setOrders(prev => {
            // Check if already in list to avoid duplicates
            if (prev.some(o => o.id === newOrder.id)) return prev;
            return [newOrder, ...prev];
          });
        } else if (activeSessionId && newOrder.table_session_id === activeSessionId) {
          setOrders(prev => {
            if (prev.some(o => o.id === newOrder.id)) return prev;
            return [...prev, newOrder];
          });
        }
      }

      if (event === 'status_changed') {
        const updatedOrder = payload as Order;
        
        setOrders(prev => 
          prev.map(o => o.id === updatedOrder.id ? { ...o, status: updatedOrder.status } : o)
        );
      }

      if (event === 'session_closed') {
        const { sessionId } = payload;
        if (activeSessionId && sessionId === activeSessionId) {
          // If customer tracking is closed, refresh will trigger session paid state checks
          refreshOrders();
        } else if (storeId) {
          // For merchant, remove orders belonging to the closed session
          setOrders(prev => prev.filter(o => o.table_session_id !== sessionId));
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [storeId, activeSessionId]);

  return { orders, loading, error, refreshOrders };
}

export default useRealtimeOrders;
