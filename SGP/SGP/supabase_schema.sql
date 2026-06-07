-- ============================================================================
-- SGP (Sistemas de Gestión de Pedidos) - MVP Schema
-- Designed for Multi-tenant (SaaS) scalability and mobile-first operations.
-- ============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. STORES (Restaurants / Merchants)
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    pin_code VARCHAR(10) NOT NULL DEFAULT '1234', -- Master login PIN for staff
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX idx_stores_slug ON stores(slug);

-- 2. TABLES (Physical tables in each store)
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- e.g., "Mesa 1", "Mesa 2"
    passcode VARCHAR(10) NOT NULL, -- Access passcode for scanning customers (e.g. 1001)
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX idx_tables_store_id ON tables(store_id);

-- 3. TABLE SESSIONS (Active sessions for diners at a table)
CREATE TABLE table_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active' or 'paid'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE, -- Marks the 15-minute disappearance window start
    CONSTRAINT chk_session_status CHECK (status IN ('active', 'paid'))
);

CREATE INDEX idx_table_sessions_table_store ON table_sessions(table_id, store_id);
CREATE INDEX idx_table_sessions_status ON table_sessions(status);

-- 4. CATEGORIES (Menu categories)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g. "Entradas", "Bebidas con Alcohol"
    order_index INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX idx_categories_store_id ON categories(store_id);

-- 5. PRODUCTS (Menu options)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    ingredients TEXT[] DEFAULT '{}'::TEXT[],
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX idx_products_category_id ON products(category_id);

-- 6. ORDERS (Orders placed in an active session)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    table_session_id UUID NOT NULL REFERENCES table_sessions(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'preparing', 'ready', 'delivered', 'cancelled'
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT chk_order_status CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled'))
);

CREATE INDEX idx_orders_session ON orders(table_session_id);
CREATE INDEX idx_orders_store_status ON orders(store_id, status);

-- 7. ORDER ITEMS (Line items per order)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================================================
-- REAL-TIME BROADCAST DOCUMENTATION & NOTES
-- ============================================================================
-- Supabase Realtime Broadcast allows client-to-client ephemeral communication.
-- This bypasses standard database triggers for UI syncing, providing sub-100ms latency.
--
-- To set up Broadcast Channels on Supabase Dashboard:
-- 1. Broadcast doesn't require database changes enabled in the "realtime" schema.
-- 2. It is activated via the JS client:
--    const channel = supabase.channel('table-orders-channel', {
--      config: {
--        broadcast: { self: false, ack: false }
--      }
--    });
--
-- 3. Clients subscribe to custom events:
--    channel.on('broadcast', { event: 'new_order' }, (payload) => {
--       console.log('New order received:', payload);
--    });
--
-- 4. Clients send updates:
--    channel.send({
--      type: 'broadcast',
--      event: 'new_order',
--      payload: { orderId: 'uuid', table: 'Mesa 3', items: [...] }
--    });
--
-- This guarantees maximum throughput, low DB CPU utilization, and robust security.
-- Row Level Security (RLS) can still protect database reads/writes of actual tables.
-- ============================================================================
