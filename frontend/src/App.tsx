import React from 'react';
// @ts-ignore
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignupPage } from './pages/onboarding/SignupPage';
import { ChildLoginPage } from './pages/auth/ChildLoginPage';
import { ChildDashboardPage } from './pages/dashboard/ChildDashboardPage';
import { ParentDashboardPage } from './pages/dashboard/ParentDashboardPage';
import { ChildManagementPage } from './pages/dashboard/ChildManagementPage';
import { ChannelManagementPage } from './pages/dashboard/ChannelManagementPage';
// @ts-ignore
import { ParentActivityPage } from './pages/dashboard/ParentActivityPage'; // Assuming this exists or I will create it/mapped it previously

function App() {
    return (
        <Router>
            <Routes>
                {/* Public / Landing */}
                <Route path="/" element={<Navigate to="/signup" replace />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* Child Routes */}
                <Route path="/child/login" element={<ChildLoginPage />} />
                <Route path="/child/dashboard" element={<ChildDashboardPage />} />

                {/* Parent Routes */}
                <Route path="/parent/dashboard" element={<ParentDashboardPage />} />
                <Route path="/parent/children" element={<ChildManagementPage />} />
                <Route path="/parent/channels/:childId" element={<ChannelManagementPage />} />
                {/* <Route path="/parent/activity/:childId" element={<ParentActivityPage />} /> */}

                {/* Fallback */}
                <Route path="*" element={<div className="p-8 text-center text-gray-500">404: Page Not Found</div>} />
            </Routes>
        </Router>
    );
}

export default App;
