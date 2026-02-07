
// @ts-ignore
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { SignupWizard as SignupPage } from './pages/onboarding/SignupPage';
import { ChildLoginPage } from './pages/auth/ChildLoginPage';
import ApiTestPage from './pages/debug/ApiTestPage';
import { ParentLoginPage } from './pages/auth/ParentLoginPage';
import { ChildDashboardPage } from './pages/dashboard/ChildDashboardPage';
import { ParentDashboardPage } from './pages/dashboard/ParentDashboardPage';
import { ChildManagementPage } from './pages/dashboard/ChildManagementPage';
import { ChannelManagementPage } from './pages/dashboard/ChannelManagementPage';
import { PlaylistManagementPage } from './pages/dashboard/PlaylistManagementPage';
import { NotificationCenterPage } from './pages/dashboard/NotificationCenterPage';
// @ts-ignore
import { ParentActivityPage } from './pages/dashboard/ParentActivityPage';
import { ParentSettingsPage } from './pages/dashboard/ParentSettingsPage';
import { ManageChildPage } from './pages/dashboard/ManageChildPage';
import ReportsPage from './pages/dashboard/ReportsPage';
import { ApprovalCenterPage } from './pages/dashboard/ApprovalCenterPage';
import { ChildAnalyticsPage } from './pages/dashboard/ChildAnalyticsPage';
import { PlaylistsPage } from './pages/child/PlaylistsPage';
import { PlaylistDetailPage } from './pages/child/PlaylistDetailPage';
import { MyRequestsPage } from './pages/child/MyRequestsPage';
import { QuestsPage } from './pages/gamification/QuestsPage';
import { ShopPage } from './pages/gamification/ShopPage';
import { AchievementsPage } from './pages/gamification/AchievementsPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';

import { SocketProvider } from './contexts/SocketContext';
import { GamificationProvider } from './contexts/GamificationContext';

// ... (imports)

// Wrapper for Child Dashboard to provide socket
// Shared Layout for authenticated child routes
const ChildLayout = () => {
    const token = localStorage.getItem('safeguard_child_token') || undefined;
    return (
        <SocketProvider token={token} role="child">
            <GamificationProvider>
                <Outlet />
            </GamificationProvider>
        </SocketProvider>
    );
};

// ...


function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ErrorBoundary>
                <Routes>
                    {/* Public / Landing */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/login" element={<ParentLoginPage />} />

                    {/* Child Routes */}
                    {/* Child Routes */}
                    <Route path="/child/login" element={<ChildLoginPage />} />

                    {/* Authenticated Child Routes */}
                    <Route element={<ChildLayout />}>
                        <Route path="/child/dashboard" element={<ChildDashboardPage />} />
                        <Route path="/child/playlists" element={<PlaylistsPage />} />
                        <Route path="/child/playlists/:id" element={<PlaylistDetailPage />} />
                        <Route path="/child/requests" element={<MyRequestsPage />} />
                        <Route path="/child/quests" element={<QuestsPage />} />
                        <Route path="/child/shop" element={<ShopPage />} />
                        <Route path="/child/achievements" element={<AchievementsPage />} />
                    </Route>

                    {/* Parent Routes */}
                    <Route path="/parent/dashboard" element={<ParentDashboardPage />} />
                    <Route path="/parent/children" element={<ChildManagementPage />} />
                    <Route path="/parent/child/:childId/playlists" element={<PlaylistsPage />} />
                    <Route path="/parent/child/:childId/playlists/:id" element={<PlaylistDetailPage />} />
                    <Route path="/parent/child/:childId/manage" element={<ManageChildPage />} />
                    <Route path="/parent/channels/:childId" element={<ChannelManagementPage />} />
                    <Route path="/parent/playlists/:childId" element={<PlaylistManagementPage />} />
                    <Route path="/parent/notifications" element={<NotificationCenterPage />} />
                    <Route path="/parent/settings" element={<ParentSettingsPage />} />
                    <Route path="/parent/reports" element={<ReportsPage />} />
                    <Route path="/parent/activity/:childId" element={<ParentActivityPage />} />
                    <Route path="/parent/approvals" element={<ApprovalCenterPage />} />
                    <Route path="/parent/child/:childId/analytics" element={<ChildAnalyticsPage />} />

                    {/* Debug */}
                    <Route path="/test-connection" element={<ApiTestPage />} />

                    {/* Fallback */}
                    <Route path="*" element={<div className="p-8 text-center text-gray-500">404: Page Not Found</div>} />
                </Routes>
            </ErrorBoundary>
        </Router>
    );
}

export default App;
