import React, { useContext, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { DoctorContext } from '../context/DoctorContext';
import { AdminContext } from '../context/AdminContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [state, setState] = useState('Doctor');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const navigate = useNavigate();

    const { handleDoctorLogin } = useContext(DoctorContext);
    const { handleAdminLogin } = useContext(AdminContext);

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        setIsLoading(true);

        try {
            if (state === 'Admin') {
                // Admin login logic remains the same
                const { data } = await axios.post(`${backendUrl}/api/admin/login`, { email, password });
                if (data.success) {
                    handleAdminLogin(data.token);
                    toast.success("Admin login successful!");
                    navigate('/admin/dashboard');
                } else {
                    toast.error(data.message);
                }
            } else { // Doctor Login
                
                // --- THIS IS THE SECTION TO CHANGE ---
                
                const { data } = await axios.post(`${backendUrl}/api/doctor/login`, { email, password });
                if (data.success) {
                    handleDoctorLogin(data.token);
                    toast.success("Doctor login successful!");

                    // Check the profileStatus received from the backend.
                    if (data.profileStatus === 'incomplete') {
                        // If the profile is incomplete, redirect to the profile page.
                        toast.info("Please complete your profile to activate your account.");
                        navigate('/doctor/profile');
                    } else {
                        // Otherwise, redirect to the dashboard as usual.
                        navigate('/doctor/dashboard');
                    }
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
                    <input onChange={(e) => setPassword(e.target.value)} value={password} className='border border-gray-300 rounded-lg w-full p-2.5 mt-1 mb-3 leading-tight focus:outline-none focus:shadow-outline' type="password" required />
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
                        : <>
                            Don't have an account? <Link to="/doctor/signup" className='text-blue-600 font-semibold underline cursor-pointer'>Sign Up here</Link>
                            <br />
                            Are you an Admin? <span onClick={() => setState('Admin')} className='text-blue-600 font-semibold underline cursor-pointer'>Login here</span>
                          </>
                    }
                </p>
            </div>
        </form>
    );
};

export default Login;