import { useEffect, useState } from 'react';

export default function ChatExpiryWarning({ expiresAt }) {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const expiry = new Date(expiresAt);
            const diffMs = expiry - now;
            
            if (diffMs <= 0) return;
            
            const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            
            setTimeLeft(`${diffHrs}h ${diffMins}m`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [expiresAt]);

    if (!timeLeft || timeLeft.includes('-')) return null;

    return (
        <div className="bg-yellow-50 text-yellow-800 p-2 text-center text-sm">
            Chat session expires in {timeLeft}
        </div>
    );
}