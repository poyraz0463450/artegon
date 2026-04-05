import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Module 1: PLM
import PartsList from './pages/parts/PartsList';
import PartDetail from './pages/parts/PartDetail';
import ModelsList from './pages/parts/ModelsList';
import StockMovements from './pages/parts/StockMovements';

// Module 2: MES
import WorkCenters from './pages/workorders/WorkCenters';
import WorkOrderList from './pages/workorders/WorkOrderList';
import WorkOrderDetail from './pages/workorders/WorkOrderDetail';
import GanttPlan from './pages/workorders/GanttPlan';

// Module 3: QMS
import InspectionPlans from './pages/qc/InspectionPlans';
import InspectionsList from './pages/qc/InspectionsList';
import InspectionDetail from './pages/qc/InspectionDetail';
import NcrRecords from './pages/qc/NcrRecords';

// Module 4: PDM (Documents)
import DocumentsList from './pages/documents/DocumentsList';

// Module 5: SCM (Purchasing)
import PurchasingDashboard from './pages/purchasing/PurchasingDashboard';
import MRPDashboard from './pages/purchasing/MRPDashboard';
import PurchaseRequests from './pages/purchasing/PurchaseRequests';
import PurchaseOrders from './pages/purchasing/PurchaseOrders';
import InventoryReceipts from './pages/purchasing/InventoryReceipts';
import SuppliersList from './pages/purchasing/SuppliersList';

// Admin
import UserManagement from './pages/admin/UserManagement';

import { NotificationProvider } from './context/NotificationContext';
import { Spinner } from './components/ui/Shared';
import { Toaster } from 'react-hot-toast';

// Placeholder for missing pages
const ComingSoon = ({ title }) => (
  <div style={{ 
    height: '100%', display: 'flex', flexDirection: 'column', 
    alignItems: 'center', justifyContent: 'center', color: '#475569' 
  }}>
    <h2 style={{ color: '#fff', marginBottom: 8 }}>{title || 'Yapım Aşamasında'}</h2>
    <p>Bu modül şu anda geliştirme aşamasındadır.</p>
  </div>
);

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        
        {/* Mühendislik (PLM) */}
        <Route path="parts" element={<PartsList />} />
        <Route path="parts/:id" element={<PartDetail />} />
        <Route path="models" element={<ModelsList />} />
        <Route path="stock-movements" element={<StockMovements />} />
        
        {/* Üretim (MES) */}
        <Route path="work-centers" element={<WorkCenters />} />
        <Route path="work-orders" element={<WorkOrderList />} />
        <Route path="work-orders/:id" element={<WorkOrderDetail />} />
        <Route path="gantt" element={<GanttPlan />} />

        {/* Kalite (QMS) */}
        <Route path="qc/plans" element={<InspectionPlans />} />
        <Route path="qc/inspections" element={<InspectionsList />} />
        <Route path="qc/inspections/:id" element={<InspectionDetail />} />
        <Route path="qc/ncr" element={<NcrRecords />} />
        <Route path="qc/tools" element={<ComingSoon title="Ölçüm Cihazları" />} />

        {/* Satınalma (SCM) */}
        <Route path="purchasing" element={<PurchasingDashboard />} />
        <Route path="purchasing/mrp" element={<MRPDashboard />} />
        <Route path="purchasing/rfq" element={<ComingSoon title="Teklif Toplama (RFQ)" />} />
        <Route path="purchasing/requests" element={<PurchaseRequests />} />
        <Route path="purchasing/orders" element={<PurchaseOrders />} />
        <Route path="purchasing/asn" element={<ComingSoon title="ASN - Sevk Bildirimi" />} />
        <Route path="purchasing/receipts" element={<InventoryReceipts />} />
        <Route path="purchasing/suppliers" element={<SuppliersList />} />
        <Route path="purchasing/invoices" element={<ComingSoon title="Faturalar" />} />

        {/* Depo / Stok (New Section for Storage logic) */}
        <Route path="inventory/cycle-counts" element={<ComingSoon title="Periyodik Sayım" />} />
        <Route path="inventory/traceability" element={<ComingSoon title="İzlenebilirlik" />} />

        {/* Dokümanlar (PDM) */}
        <Route path="documents" element={<DocumentsList />} />
        <Route path="documents/:id" element={<ComingSoon title="Doküman Detay" />} />

        {/* Admin */}
        <Route path="admin/users" element={<UserManagement />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Toaster position="top-right" />
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

