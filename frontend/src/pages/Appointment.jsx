import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import RelatedDoctors from '../components/RelatedDoctors';
import { assets } from '../assets/assets';
import RazorpayPaymentModal from '../components/RazorpayPaymentModal';
import axios from 'axios'; // Ensure axios is imported
import { toast } from 'react-toastify'; // Ensure toast is imported

const LoadingSpinner = () => (
    <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-600"></div>
    </div>
);

const VerifiedIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const Appointment = () => {
    const { docId } = useParams();
    const { 
        doctors, 
        currencySymbol, 
        token, 
        backendUrl, // Get backendUrl from context
        initiateChatPayment,
        verifyChatPayment // Get verifyChatPayment from context
    } = useContext(AppContext);
    
    const navigate = useNavigate();
    const [docInfo, setDocInfo] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState(null);
    const [availability, setAvailability] = useState(true);

    useEffect(() => {
        const fetchDoctorInfo = async () => {
            try {
                let doctor = doctors.find(doc => doc._id === docId);
                
                if (!doctor) {
                    // --- BUG FIX #1: Correct API Endpoint ---
                    // The correct public route is /api/doctor/profile/:id
                    const { data } = await axios.get(`${backendUrl}/api/doctor/profile/${docId}`);
                    if (data.success) {
                        doctor = data.profileData;
                    } else {
                        throw new Error(data.message);
                    }
                }
                
                setDocInfo(doctor);
                setAvailability(doctor.available);
            } catch (error) {
                console.error('Error fetching doctor:', error);
                toast.error("Could not load doctor details.");
                navigate('/doctors');
            }
        };

        if (docId) {
            fetchDoctorInfo();
        }
    }, [docId, doctors, navigate, backendUrl]);

    const handlePaymentInitiation = async () => {
        if (!token) {
            navigate('/login', { state: { from: `/appointment/${docId}` } });
            return;
        }

        try {
            const paymentData = await initiateChatPayment(docId);

            // --- BUG FIX #2: Safety Check Before Opening Modal ---
            // Only open the modal if the API call was successful and returned an order.
            if (paymentData && paymentData.success) {
                setPaymentDetails(paymentData);
                setShowPaymentModal(true);
            } else {
                // Show the error from the backend (e.g., "Not Authorized")
                toast.error(paymentData.message || 'Could not initiate payment.');
            }
        } catch (error) {
            console.error('Payment error:', error);
            toast.error(error.response?.data?.message || 'A network error occurred.');
            if (error.response?.status === 400) {
                setAvailability(false);
            }
        }
    };

    const handlePaymentSuccess = async (paymentResponse) => {
        try {
            // --- BUG FIX #3: Send doctorId along with payment data for verification ---
            const dataToVerify = {
                ...paymentResponse, // This contains razorpay_payment_id, etc.
                doctorId: docId
            };

            const data = await verifyChatPayment(dataToVerify);

            if (data.success) {
                toast.success("Payment successful! Redirecting to chat...");
                navigate(`/chat/${data.chat._id}`);
            } else {
                toast.error(data.message || "Payment verification failed.");
            }
        } catch (error) {
            console.error('Verification failed:', error);
            toast.error(error.response?.data?.message || "An error occurred during verification.");
        } finally {
            setShowPaymentModal(false);
        }
    };

    if (!docInfo) return <LoadingSpinner />;

    return (
        // ... your JSX remains the same ...
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto py-12 px-4">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="md:flex">
                        <div className="md:w-1/3">
                            <img
                                src={docInfo.image || assets.default_doctor}
                                alt={docInfo.name}
                                className="w-full h-64 md:h-full object-cover"
                                onError={(e) => e.target.src = assets.default_doctor}
                            />
                        </div>
                        <div className="md:w-2/3 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <h1 className="text-2xl font-bold">{docInfo.name}</h1>
                                <VerifiedIcon />
                                <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold ${
                                    availability ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {availability ? 'Available' : 'Unavailable'}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="text-gray-500 text-sm">Specialization</p>
                                    <p className="font-medium">{docInfo.speciality}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Experience</p>
                                    <p className="font-medium">{docInfo.experience} years</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Qualification</p>
                                    <p className="font-medium">{docInfo.degree}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Consultation Fee</p>
                                    <p className="font-medium text-green-600">{currencySymbol}{docInfo.fees}</p>
                                </div>
                            </div>
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold mb-2">About</h2>
                                <p className="text-gray-600">{docInfo.about || 'No information available'}</p>
                            </div>
                            <button
                                onClick={handlePaymentInitiation}
                                disabled={!availability}
                                className={`w-full py-3 rounded-lg font-semibold ${
                                    availability
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {availability ? 'Start Consultation' : 'Not Available'}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="mt-12">
                    <h2 className="text-xl font-bold mb-4">Similar Doctors</h2>
                    <RelatedDoctors speciality={docInfo.speciality} currentDoctorId={docId} />
                </div>
                {showPaymentModal && paymentDetails && (
                    <RazorpayPaymentModal
                        paymentDetails={paymentDetails}
                        onClose={() => setShowPaymentModal(false)}
                        onSuccess={handlePaymentSuccess}
                        doctorName={docInfo.name}
                        amount={docInfo.fees}
                    />
                )}
            </div>
        </div>
    );
};

export default Appointment;