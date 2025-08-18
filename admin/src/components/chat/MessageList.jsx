export default function MessageList({ messages, userId, scrollRef }) {
    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
                <div 
                    key={message._id} 
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    <div className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                        message.sender === 'user' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white text-gray-800 shadow'
                    } ${message.status === 'failed' ? 'opacity-75' : ''}`}>
                        <p>{message.text}</p>
                        <div className="flex justify-between items-center mt-1">
                            <span className={`text-xs ${
                                message.sender === 'user' 
                                    ? 'text-blue-100' 
                                    : 'text-gray-500'
                            }`}>
                                {new Date(message.createdAt).toLocaleTimeString([], { timeStyle: 'short' })}
                            </span>
                            {message.status === 'failed' && (
                                <span className="text-xs text-red-300 ml-2">Failed</span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            <div ref={scrollRef} />
        </div>
    );
}