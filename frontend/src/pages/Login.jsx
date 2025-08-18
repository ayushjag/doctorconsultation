import React, { useContext, useState, useEffect } from 'react';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const Spinner = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

const Login = () => {
    // --- FIX #1: Change 'state' to 'stage' to manage three views ---
    const [stage, setStage] = useState('Login'); // Can be 'Login', 'Sign Up', or 'Verify OTP'
    
    // --- Form states ---
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState(''); // New state for OTP input
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { backendUrl, token, handleLogin } = useContext(AppContext);

    // --- FIX #2: Create separate handlers for each action ---

    // Handler for Login
    const handleLoginSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            const { data } = await axios.post(`${backendUrl}/api/user/login`, { email, password });
            if (data.success) {
                handleLogin(data.token);
                toast.success(`Welcome back!`);
                navigate('/');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    // Handler for Requesting OTP
    const handleRegisterSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            const { data } = await axios.post(`${backendUrl}/api/user/register/request-otp`, { name, email, password });
            if (data.success) {
                toast.success(data.message);
                setStage('Verify OTP'); // Move to the next stage
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send OTP.');
        } finally {
            setLoading(false);
        }
    };

    // Handler for Verifying OTP
    const handleVerifySubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            const { data } = await axios.post(`${backendUrl}/api/user/register/verify-otp`, { email, otp });
            if (data.success) {
                toast.success("Registration successful! Please log in.");
                setStage('Login'); // Take user back to the login screen
                // Clear password and OTP fields for security/UX
                setPassword('');
                setOtp('');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'OTP verification failed.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            navigate('/');
        }
    }, [token, navigate]);

    return (
        <div className="min-h-[calc(100vh-80px)] bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl grid md:grid-cols-2 overflow-hidden">
                <div className="p-8 md:p-12">

                    {/* --- FIX #3: Conditionally render the correct form based on the stage --- */}

                    {/* LOGIN FORM */}
                    {stage === 'Login' && (
                        <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">
                            <h1 className="text-3xl font-bold text-gray-800">Login</h1>
                            <p className="text-gray-500">Welcome back! Please login to your account.</p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email</label>
                                <input id="email" onChange={(e) => setEmail(e.target.value)} value={email} className="w-full px-4 py-2 bg-gray-100 border rounded-lg" type="email" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Password</label>
                                <input id="password" onChange={(e) => setPassword(e.target.value)} value={password} className="w-full px-4 py-2 bg-gray-100 border rounded-lg" type="password" required />
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 my-2 rounded-lg font-semibold flex items-center justify-center disabled:bg-blue-400">
                                {loading ? <Spinner /> : 'Login'}
                            </button>
                            <p className="text-center text-sm text-gray-600">
                                Don't have an account? <span onClick={() => setStage('Sign Up')} className="text-blue-600 font-semibold underline cursor-pointer">Sign up</span>
                            </p>
                        </form>
                    )}

                    {/* SIGN UP FORM */}
                    {stage === 'Sign Up' && (
                        <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-5">
                            <h1 className="text-3xl font-bold text-gray-800">Sign Up</h1>
                            <p className="text-gray-500">Create an account to get started.</p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">Full Name</label>
                                <input id="name" onChange={(e) => setName(e.target.value)} value={name} className="w-full px-4 py-2 bg-gray-100 border rounded-lg" type="text" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email</label>
                                <input id="email" onChange={(e) => setEmail(e.target.value)} value={email} className="w-full px-4 py-2 bg-gray-100 border rounded-lg" type="email" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Password</label>
                                <input id="password" onChange={(e) => setPassword(e.target.value)} value={password} className="w-full px-4 py-2 bg-gray-100 border rounded-lg" type="password" required />
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 my-2 rounded-lg font-semibold flex items-center justify-center disabled:bg-blue-400">
                                {loading ? <Spinner /> : 'Create Account'}
                            </button>
                            <p className="text-center text-sm text-gray-600">
                                Already have an account? <span onClick={() => setStage('Login')} className="text-blue-600 font-semibold underline cursor-pointer">Login here</span>
                            </p>
                        </form>
                    )}

                    {/* VERIFY OTP FORM */}
                    {stage === 'Verify OTP' && (
                        <form onSubmit={handleVerifySubmit} className="flex flex-col gap-5">
                            <h1 className="text-3xl font-bold text-gray-800">Verify Your Email</h1>
                            <p className="text-gray-500">An OTP has been sent to <strong>{email}</strong>. Please enter it below to complete your registration.</p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="otp">Enter OTP</label>
                                <input id="otp" onChange={(e) => setOtp(e.target.value)} value={otp} className="w-full px-4 py-2 bg-gray-100 border rounded-lg" type="text" required />
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 my-2 rounded-lg font-semibold flex items-center justify-center disabled:bg-green-400">
                                {loading ? <Spinner /> : 'Verify & Complete'}
                            </button>
                        </form>
                    )}
                </div>
                <div className="hidden md:block">
                    <img src={assets.login_image || '...'} alt="Doctor and patient" className="w-full h-full object-cover" />
                </div>
            </div>
        </div>
    );
};

export default Login;