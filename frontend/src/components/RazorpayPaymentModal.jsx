import React, { useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext'; // Import AppContext
import { assets } from '../assets/assets';

const RazorpayPaymentModal = ({
    paymentDetails,
    onClose,
    onSuccess,
    doctorName,
    amount
}) => {
    // Get userData from context to prefill user details
    const { userData } = useContext(AppContext);

    useEffect(() => {
        // Check if the Razorpay script is loaded
        if (!window.Razorpay) {
            alert('Razorpay SDK failed to load. Please check your internet connection.');
            onClose();
            return;
        }

        const options = {
            key: paymentDetails.key, // Your Razorpay Key ID
            amount: paymentDetails.order.amount,
            currency: paymentDetails.order.currency,
            name: 'HEALTHLIFE',
            description: `Consultation with Dr. ${doctorName}`,
            image: assets.logo, // Optional: A publicly accessible URL to your logo
            order_id: paymentDetails.order.id,

            // This function is called after a successful payment
            handler: function(response) {
                // Pass the entire response to the onSuccess handler
                onSuccess(response);
            },

            // Pre-fill user information
            prefill: {
                name: userData?.name || 'Your Name',
                email: userData?.email || 'your.email@example.com',
                contact: userData?.phone || '9999999999'
            },
            notes: {
                address: 'HealthLife Corporate Office'
            },
            theme: {
                color: '#3399cc'
            }
        };

        // Create a new Razorpay instance and open the checkout
        const rzp = new window.Razorpay(options);
        rzp.open();

        // Handle payment failure
        rzp.on('payment.failed', function(response) {
            console.error('Payment Failed:', response.error);
            alert(`Payment Failed: ${response.error.description}`);
            onClose();
        });

    }, [paymentDetails, onClose, onSuccess, doctorName, userData]); // Add userData to dependencies

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Complete Payment</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                    >
                        &times;
                    </button>
                </div>

                <div className="mb-4">
                    <p className="text-gray-600">Consultation with: <span className="font-medium">{doctorName}</span></p>
                    <p className="text-gray-600">Amount: <span className="font-medium">₹{amount}</span></p>
                </div>

                <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>

                <p className="text-sm text-gray-500 text-center">
                    Redirecting to Razorpay secure payment...
                </p>
            </div>
        </div>
    );
};

export default RazorpayPaymentModal;