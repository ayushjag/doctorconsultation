import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DoctorContext } from '../../context/DoctorContext'; // Use DoctorContext
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import PatientHeader from '../../components/chat/PatientHeader';
import MessageList from '../../components/chat/MessageList';
import MessageInput from '../../components/chat/MessageInput';
 import ChatExpiryWarning from "../../components/chat/ChatExpiryWarning";
import { toast } from 'react-toastify';

const DoctorChatPage = () => {
    const { chatId } = useParams();
    const { dToken, backendUrl } = useContext(DoctorContext); // Use dToken
    const { userData } = useContext(AppContext); // Assuming userData has doctor's own ID
    
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        let intervalId;

        const loadChatData = async () => {
            if (!dToken || !chatId) {
                navigate('/doctor/login'); // Redirect to doctor login
                return;
            }
            try {
                setIsLoading(true);
                // Fetch chat directly for the doctor
                const { data } = await axios.get(`${backendUrl}/api/doctor/chats/single/${chatId}`, { // Doctor-specific endpoint
                    headers: { Authorization: `Bearer ${dToken}` }
                });
                
                if (data.success) {
                    const chat = data.chat;
                    if (!chat) {
                        toast.error("Chat not found or access denied.");
                        navigate('/doctor/dashboard'); // Redirect to doctor dashboard
                        return;
                    }
                    if (new Date(chat.expiresAt) < new Date()) {
                        toast.warn('This chat session has expired.');
                        // Optionally, keep the chat viewable but disable input
                    }
                    setCurrentChat(chat);
                    setMessages(chat.messages || []);

                    // Setup polling for new messages
                    intervalId = setInterval(() => {
                        // Re-fetch chat to get latest messages
                        axios.get(`${backendUrl}/api/doctor/chats/single/${chatId}`, { headers: { Authorization: `Bearer ${dToken}` } })
                            .then(res => {
                                if (res.data.success) {
                                    setCurrentChat(res.data.chat);
                                    setMessages(res.data.chat.messages || []);
                                }
                            })
                            .catch(err => console.error("Polling error:", err));
                    }, 5000); // Poll every 5 seconds

                } else {
                    throw new Error(data.message);
                }

            } catch (err) {
                setError('Failed to load chat.');
                console.error(err);
                toast.error(err.response?.data?.message || "Failed to load chat.");
                navigate('/doctor/dashboard'); // Redirect on error
            } finally {
                setIsLoading(false);
            }
        };

        loadChatData();

        // Cleanup the interval when the component unmounts
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [chatId, dToken, backendUrl, navigate]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (messageText) => {
        if (!messageText.trim() || !currentChat) return;

        const tempId = Date.now().toString();
        
        const newMessage = {
            _id: tempId,
            text: messageText,
            sender: 'doctor', // Sender is doctor
            createdAt: new Date(),
            status: 'sending'
        };
        
        setMessages(prev => [...prev, newMessage]);

        try {
            await axios.post(`${backendUrl}/api/doctor/chats/reply`, // Doctor-specific reply endpoint
                {
                    chatId: currentChat._id,
                    text: messageText
                }, 
                {
                    headers: { Authorization: `Bearer ${dToken}` }
                }
            );
            // On success, re-fetch chat to get the confirmed message and any new messages
            const { data } = await axios.get(`${backendUrl}/api/doctor/chats/single/${currentChat._id}`, { headers: { Authorization: `Bearer ${dToken}` } });
            if (data.success) {
                setCurrentChat(data.chat);
                setMessages(data.chat.messages || []);
            }
        } catch (error) {
            console.error('Message send failed:', error);
            toast.error(error.response?.data?.message || "Failed to send message.");
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
            <PatientHeader 
                patient={currentChat.userId} // Display patient info
                expiresAt={currentChat.expiresAt} 
            />
            <ChatExpiryWarning expiresAt={currentChat.expiresAt} />
            <MessageList 
                messages={messages} 
                userId={userData?._id} // Doctor's own ID for message alignment
                scrollRef={messagesEndRef} 
            />
            <MessageInput 
                onSendMessage={handleSendMessage} 
                disabled={false}
            />
        </div>
    );
};

export default DoctorChatPage;