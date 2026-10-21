import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './components/common/Toast';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { SignupPage } from './pages/SignupPage';
import { RegisterPage } from './pages/RegisterPage';
import { RegisterCompanyPage } from './pages/RegisterCompanyPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { DatasetExplorerPage } from './pages/DatasetExplorerPage';
import { DatasetDetailPage } from './pages/DatasetDetailPage';
import { DatasetUploadPage } from './pages/DatasetUploadPage';
import { AskYourDataPage } from './pages/AskYourDataPage';
import { PredictiveAiPage } from './pages/PredictiveAiPage';
import { ExplainableAiPage } from './pages/ExplainableAiPage';
import { SqlEditorPage } from './pages/SqlEditorPage';
import { DashboardBuilderPage } from './pages/DashboardBuilderPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { CompanySettingsPage } from './pages/CompanySettingsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { ProfilePage } from './pages/ProfilePage';
import { HelpCenterPage } from './pages/HelpCenterPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <DataProvider>
            <ToastProvider>
              <BrowserRouter>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/register" element={<SignupPage defaultMode="user" />} />
                  <Route path="/register-tenant" element={<SignupPage defaultMode="company" />} />
                  <Route path="/register-company" element={<SignupPage defaultMode="company" />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/403" element={<ForbiddenPage />} />

                  {/* Authenticated routes inside AppLayout */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <AppLayout />
                      </ProtectedRoute>
                    }
                  >
                    {/* All roles */}
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/datasets" element={<DatasetExplorerPage />} />
                    <Route path="/datasets/:id" element={<DatasetDetailPage />} />
                    <Route path="/ask" element={<AskYourDataPage />} />
                    <Route path="/predict" element={<PredictiveAiPage />} />
                    <Route path="/xai" element={<ExplainableAiPage />} />
                    <Route path="/explainable-ai" element={<Navigate to="/xai" replace />} />
                    <Route path="/sql" element={<SqlEditorPage />} />
                    <Route path="/visualizations" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboards" element={<DashboardBuilderPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/help" element={<HelpCenterPage />} />


                    {/* ADMIN, HR, and STAFF */}
                    <Route
                      path="/upload"
                      element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'HR', 'STAFF']}>
                          <DatasetUploadPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* ADMIN only */}
                    <Route
                      path="/users"
                      element={
                        <ProtectedRoute allowedRoles={['ADMIN']}>
                          <UserManagementPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute allowedRoles={['ADMIN']}>
                          <CompanySettingsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/audit"
                      element={
                        <ProtectedRoute allowedRoles={['ADMIN']}>
                          <AuditLogPage />
                        </ProtectedRoute>
                      }
                    />
                  </Route>

                  {/* Fallback 404 */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </BrowserRouter>
            </ToastProvider>
          </DataProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
