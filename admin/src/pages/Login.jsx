import React, { useContext, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { DoctorContext } from '../context/DoctorContext';
import { AdminContext } from '../context/AdminContext';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const Login = () => {
    const [state, setState] = useState('Admin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Add a loading state

    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const navigate = useNavigate(); // Initialize navigate

    // --- FIX #1: Use the centralized login handler functions ---
    const { handleDoctorLogin } = useContext(DoctorContext);
    const { handleAdminLogin } = useContext(AdminContext); // Assuming you add this to AdminContext

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        setIsLoading(true);

        try {
            if (state === 'Admin') {
                const { data } = await axios.post(`${backendUrl}/api/admin/login`, { email, password });
                if (data.success) {
                    // --- FIX #2: Call the centralized login handler ---
                    handleAdminLogin(data.token);
                    toast.success("Admin login successful!");
                    navigate('/admin/dashboard'); // Redirect admin
                } else {
                    toast.error(data.message);
                }
            } else { // Doctor Login
                const { data } = await axios.post(`${backendUrl}/api/doctor/login`, { email, password });
                if (data.success) {
                    // --- FIX #2: Call the centralized login handler ---
                    handleDoctorLogin(data.token);
                    toast.success("Doctor login successful!");
                    // The logic to redirect to profile or dashboard will be handled
                    // by the main app component listening to the token change.
                    navigate('/doctor/dashboard'); // Redirect doctor
                } else {
                    toast.error(data.message);
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Login failed. Please check your credentials.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center justify-center bg-gray-50'>
            <div className='flex flex-col gap-5 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border bg-white rounded-xl text-gray-700 shadow-lg'>
                <h1 className='text-3xl font-bold m-auto text-gray-800'><span className='text-blue-600'>{state}</span> Login</h1>
                <div className='w-full'>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input onChange={(e) => setEmail(e.target.value)} value={email} className='border border-gray-300 rounded-lg w-full p-2.5 mt-1 focus:ring-2 focus:ring-blue-500' type="email" required />
                </div>
                <div className='w-full'>
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <input onChange={(e) => setPassword(e.target.value)} value={password} className='border border-gray-300 rounded-lg w-full p-2.5 mt-1 focus:ring-2 focus:ring-blue-500' type="password" required />
                </div>
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className='bg-blue-600 text-white w-full py-2.5 rounded-lg text-base font-semibold hover:bg-blue-700 transition disabled:bg-blue-400'
                >
                    {isLoading ? 'Logging in...' : 'Login'}
                </button>
                <p className="text-center w-full text-sm">
                    {state === 'Admin'
                        ? <>Are you a Doctor? <span onClick={() => setState('Doctor')} className='text-blue-600 font-semibold underline cursor-pointer'>Login here</span></>
                        : <>Are you an Admin? <span onClick={() => setState('Admin')} className='text-blue-600 font-semibold underline cursor-pointer'>Login here</span></>
                    }
                </p>
            </div>
        </form>
    );
};

export default Login;