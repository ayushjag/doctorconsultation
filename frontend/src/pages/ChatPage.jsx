import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import DoctorHeader from '../components/chat/DoctorHeader';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import ChatExpiryWarning from '../components/chat/ChatExpiryWarning';
import { toast } from 'react-toastify';

const ChatPage = () => {
    const { chatId } = useParams();
    // Get backendUrl to make full API calls
    const { token, backendUrl, userData, activeChats, loadActiveChats } = useContext(AppContext);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    // Use a more robust strategy for loading chat data
    useEffect(() => {
        let intervalId;

        const loadChatData = async () => {
            if (!token || !chatId) {
                navigate('/login');
                return;
            }
            try {
                setIsLoading(true);
                // First, try to find the chat in the context.
                let chat = activeChats.find(c => c._id === chatId);

                // If not found (e.g., page refresh), fetch it directly.
                if (!chat) {
                    const { data } = await axios.get(`${backendUrl}/api/chats/single/${chatId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (data.success) {
                        chat = data.chat;
                        await loadActiveChats(); // Also refresh the main list
                    } else {
                        throw new Error(data.message);
                    }
                }
                
                if (!chat) {
                    toast.error("Chat not found or access denied.");
                    navigate('/doctors');
                    return;
                }
                if (new Date(chat.expiresAt) < new Date()) {
                    toast.warn('This chat session has expired.');
                    navigate('/doctors');
                    return;
                }

                setCurrentChat(chat);
                setMessages(chat.messages || []);

                // Setup polling for new messages
                intervalId = setInterval(() => loadActiveChats(), 5000);

            } catch (err) {
                setError('Failed to load chat.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        loadChatData();

        // Cleanup the interval when the component unmounts
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [chatId, token, activeChats]); // Rerun when activeChats changes to update messages

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // --- THIS IS THE FULLY CORRECTED FUNCTION ---
    const handleSendMessage = async (messageText) => {
        if (!messageText.trim() || !currentChat) return;

        // BUG FIX #2: Declare tempId outside the try/catch blocks
        const tempId = Date.now().toString();
        
        const newMessage = {
            _id: tempId,
            text: messageText,
            sender: 'user',
            createdAt: new Date(),
            status: 'sending'
        };
        
        setMessages(prev => [...prev, newMessage]);

        try {
            // BUG FIX #1: Use the correct API endpoint and payload
            await axios.post(`${backendUrl}/api/chats/message`, 
                {
                    chatId: currentChat._id,
                    text: messageText
                }, 
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            await loadActiveChats();
        } catch (error) {
            console.error('Message send failed:', error);
            toast.error("Failed to send message.");
            // This now works correctly because tempId is in scope
            setMessages(prev => prev.map(msg => 
                msg._id === tempId ? { ...msg, status: 'failed' } : msg
            ));
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !currentChat) {
        return (
            <div className="flex justify-center items-center h-screen text-red-500 text-lg">
                {error || "Could not load the chat session."}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <DoctorHeader 
                doctor={currentChat.doctorId} 
                expiresAt={currentChat.expiresAt} 
            />
            <ChatExpiryWarning expiresAt={currentChat.expiresAt} />
            <MessageList 
                messages={messages} 
                userId={userData?._id} 
                scrollRef={messagesEndRef} 
            />
            <MessageInput 
                onSendMessage={handleSendMessage} 
                disabled={new Date(currentChat.expiresAt) < new Date()}
            />
        </div>
    );
};

export default ChatPage;