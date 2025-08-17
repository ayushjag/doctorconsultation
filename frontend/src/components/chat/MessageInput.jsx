import { useState } from 'react';

export default function MessageInput({ onSendMessage, disabled }) {
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim() && !disabled) {
            onSendMessage(message);
            setMessage('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-4 border-t">
            <div className="flex items-center">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={disabled ? "Chat session expired" : "Type your message..."}
                    className="flex-1 border rounded-l-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    disabled={disabled}
                />
                <button
                    type="submit"
                    disabled={!message.trim() || disabled}
                    className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Send
                </button>
            </div>
        </form>
    );
}