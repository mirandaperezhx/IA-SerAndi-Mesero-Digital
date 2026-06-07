import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

// Pages import
import QRLanding from './features/customer/pages/QRLanding';
import CustomerMenu from './features/customer/pages/CustomerMenu';
import OrderStatus from './features/customer/pages/OrderStatus';
import StaffLogin from './features/auth/pages/StaffLogin';
import KitchenDashboard from './features/merchant/pages/KitchenDashboard';
import WaiterDashboard from './features/merchant/pages/WaiterDashboard';

export const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Customer paths */}
          <Route path="/" element={<QRLanding />} />
          <Route path="/s/:storeSlug/t/:tableId" element={<QRLanding />} />
          <Route path="/menu" element={<CustomerMenu />} />
          <Route path="/status" element={<OrderStatus />} />
          
          {/* Staff Login / Dashboards */}
          <Route path="/login" element={<StaffLogin />} />
          <Route path="/kitchen" element={<KitchenDashboard />} />
          <Route path="/waiter" element={<WaiterDashboard />} />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
};

export default App;
