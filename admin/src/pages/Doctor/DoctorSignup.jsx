import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DoctorContext } from '../../context/DoctorContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const DoctorSignup = () => {
    // State for the two stages of signup
    const [stage, setStage] = useState('register'); // 'register' or 'verify'
    
    // Form inputs
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');

    // --- FIX: Only backendUrl is needed here now ---
    const { backendUrl } = useContext(DoctorContext);
    const navigate = useNavigate();

    // Handler for the first stage: requesting OTP
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${backendUrl}/api/doctor/register/request-otp`, {
                name,
                email,
                password
            });

            if (response.data.success) {
                toast.success(response.data.message);
                setStage('verify'); // Move to the OTP verification stage
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send OTP. Please try again.');
        }
    };

    // Handler for the second stage: verifying OTP
    const handleVerifySubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${backendUrl}/api/doctor/register/verify-otp`, {
                email, // We need to send the email again to identify the user
                otp
            });

            if (response.data.success) {
                // --- THIS IS THE FIX ---
                // 1. Change the success message to prompt the user to log in.
                toast.success("Registration successful! Please log in to continue.");

                // 2. REMOVE the lines that automatically log the user in.
                // setDToken(response.data.token);
                // localStorage.setItem('dToken', response.data.token);

                // 3. Navigate to the doctor's LOGIN page instead of the dashboard.
                navigate('/doctor/login'); 
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'OTP verification failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                
                {/* STAGE 1: REGISTRATION FORM */}
                {stage === 'register' && (
                    <>
                        <h2 className="text-2xl font-bold text-center mb-6">Doctor Signup</h2>
                        <form onSubmit={handleRegisterSubmit}>
                             <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">Name</label>
                                <input type="text" id="name" className="shadow appearance-none border rounded w-full py-2 px-3" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
                                <input type="email" id="email" className="shadow appearance-none border rounded w-full py-2 px-3" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
                                <input type="password" id="password" className="shadow appearance-none border rounded w-full py-2 px-3" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>
                            <div className="flex items-center justify-between">
                                <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full">Sign Up</button>
                            </div>
                            <p className="text-center text-gray-600 text-sm mt-4">
                                Already have an account? <Link to="/doctor/login" className="text-blue-500 hover:text-blue-800">Login here</Link>
                            </p>
                        </form>
                    </>
                )}

                {/* STAGE 2: OTP VERIFICATION FORM */}
                {stage === 'verify' && (
                    <>
                        <h2 className="text-2xl font-bold text-center mb-4">Verify Your Email</h2>
                        <p className="text-center text-gray-600 text-sm mb-6">An OTP has been sent to <strong>{email}</strong>. Please enter it below.</p>
                        <form onSubmit={handleVerifySubmit}>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="otp">Enter OTP</label>
                                <input type="text" id="otp" className="shadow appearance-none border rounded w-full py-2 px-3" placeholder="6-Digit Code" value={otp} onChange={(e) => setOtp(e.target.value)} required />
                            </div>
                            <div className="flex items-center justify-between">
                                <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full">Verify & Register</button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default DoctorSignup;