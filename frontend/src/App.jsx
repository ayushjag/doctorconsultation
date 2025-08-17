import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Preloader from './components/Preloader';
import Home from './pages/Home';
import Doctors from './pages/Doctors';
import Login from './pages/Login';
import About from './pages/About';
import Contact from './pages/Contact';
import Appointment from './pages/Appointment';
import MyProfile from './pages/MyProfile';
import ChatPage from './pages/ChatPage';
import ProtectedRoute from './components/ProtectedRoute';

// --- STEP 1: Import your new component ---
import MyConsultations from './pages/MyConsultations'; // Replaces MyAppointments

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Preloader />;
  }

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Navbar />
      <main className="py-6">
        <Routes>
          {/* Public Routes */}
          <Route path='/' element={<Home />} />
          <Route path='/doctors' element={<Doctors />} />
          <Route path='/doctors/:speciality' element={<Doctors />} />
          <Route path='/login' element={<Login />} />
          <Route path='/about' element={<About />} />
          <Route path='/contact' element={<Contact />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path='/appointment/:docId' element={<Appointment />} />
            <Route path='/my-profile' element={<MyProfile />} />
            <Route path='/chat/:chatId' element={<ChatPage />} />

            {/* --- STEP 2: Update the route to use the new component --- */}
            {/* It's also good practice to update the path for clarity */}
            <Route path='/my-consultations' element={<MyConsultations />} />
            
          </Route>
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;