import React, { useContext } from 'react'; // <-- THIS IS THE FIX
import { assets } from '../assets/assets';
import { DoctorContext } from '../context/DoctorContext';
import { AdminContext } from '../context/AdminContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();

    // Now that 'useContext' is imported, these lines will work correctly.
    const { dToken, handleDoctorLogout } = useContext(DoctorContext);
    const { aToken, handleAdminLogout } = useContext(AdminContext);

    const onLogout = () => {
        if (aToken) {
            handleAdminLogout();
        } else if (dToken) {
            handleDoctorLogout();
        }
        // Redirect to the login page after logging out
        navigate('/');
    };

    // Determine the current role for display
    const currentRole = aToken ? 'Admin' : dToken ? 'Doctor' : null;

    return (
        <div className='flex justify-between items-center px-4 sm:px-10 py-3 border-b bg-white shadow-sm'>
            <div className='flex items-center gap-3'>
                <img 
                    className='w-28' 
                    src={assets.logo} 
                    alt="Logo" 
                />
                {currentRole && (
                    <p className='border px-2.5 py-0.5 rounded-full border-gray-400 text-gray-600 text-xs font-semibold'>
                        {currentRole} Panel
                    </p>
                )}
            </div>
            
            {(aToken || dToken) && (
                <button 
                    onClick={onLogout} 
                    className='bg-blue-600 text-white text-sm px-6 py-2 rounded-full hover:bg-blue-700 transition-all'
                >
                    Logout
                </button>
            )}
        </div>
    );
};

export default Navbar;