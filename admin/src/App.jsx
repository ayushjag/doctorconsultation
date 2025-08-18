import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { DoctorContext } from './context/DoctorContext';
import { AdminContext } from './context/AdminContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';

// Import the CORRECT, refactored Admin pages
import AdminDashboard from './pages/Admin/Dashboard';
import AddDoctor from './pages/Admin/AddDoctor';
import DoctorsList from './pages/Admin/DoctorsList';
import AllConsultations from './pages/Admin/AllConsultations';

// Import the CORRECT, refactored Doctor pages
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import DoctorProfile from './pages/Doctor/DoctorProfile';
// You will need to create this page for doctors to reply to chats
import DoctorChatPage from './pages/Doctor/DoctorChatPage'; 
import DoctorSignup from './pages/Doctor/DoctorSignup'; 

const App = () => {
    const { dToken } = useContext(DoctorContext);
    const { aToken } = useContext(AdminContext);

    // This component protects routes that require an admin to be logged in.
    const AdminProtectedRoute = ({ children }) => {
        return aToken ? children : <Navigate to="/" />;
    };

    // This component protects routes that require a doctor to be logged in.
    const DoctorProtectedRoute = ({ children }) => {
        return dToken ? children : <Navigate to="/" />;
    };

    return (
        <div className='bg-gray-50 min-h-screen'>
            <ToastContainer position="top-right" autoClose={3000} />
            
            <Routes>
                {/* Login Page: If not logged in, show Login. If logged in, redirect to the correct dashboard. */}
                <Route path="/" element={!aToken && !dToken ? <Login /> : (aToken ? <Navigate to="/admin/dashboard" /> : <Navigate to="/doctor/dashboard" />)} />
                <Route path="/doctor/signup" element={<DoctorSignup />} /> 

                {/* --- Admin Portal Routes --- */}
                <Route path="/admin/*" element={
                    <AdminProtectedRoute>
                        <div className="flex min-h-screen">
                            <Sidebar />
                            <main className="flex-1">
                                <Navbar />
                                <Routes>
                                    <Route path="dashboard" element={<AdminDashboard />} />
                                    <Route path="consultations" element={<AllConsultations />} />
                                    <Route path="add-doctor" element={<AddDoctor />} />
                                    <Route path="doctors" element={<DoctorsList />} />
                                </Routes>
                            </main>
                        </div>
                    </AdminProtectedRoute>
                } />

                {/* --- Doctor Portal Routes --- */}
                <Route path="/doctor/*" element={
                    <DoctorProtectedRoute>
                        <div className="flex min-h-screen">
                            <Sidebar />
                            <main className="flex-1">
                                <Navbar />
                                <Routes>
                                    <Route path="dashboard" element={<DoctorDashboard />} />
                                    <Route path="profile" element={<DoctorProfile />} />
                                    <Route path="chat/:chatId" element={<DoctorChatPage />} />
                                </Routes>
                            </main>
                        </div>
                    </DoctorProtectedRoute>
                } />
            </Routes>
        </div>
    );
};

export default App;