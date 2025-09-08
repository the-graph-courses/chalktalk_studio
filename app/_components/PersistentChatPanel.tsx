'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, Paperclip, Loader2, Bot, User, History, Plus, ChevronDown, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

interface PersistentChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
    isTestPanelOpen?: boolean;
}

interface ChatHistoryItem {
    _id: Id<"ChatTable">;
    title: string;
    _creationTime: number;
    messageCount: number;
    lastMessage: any;
}

async function convertFilesToDataURLs(files: FileList) {
    return Promise.all(
        Array.from(files).map(
            file =>
                new Promise<{
                    type: 'file';
                    mediaType: string;
                    url: string;
                }>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        resolve({
                            type: 'file',
                            mediaType: file.type,
                            url: reader.result as string,
                        });
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                }),
        ),
    );
}

function formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

export default function PersistentChatPanel({ isOpen, onClose, isTestPanelOpen = false }: PersistentChatPanelProps) {
    const { user } = useUser();
    const [input, setInput] = useState('');
    const [files, setFiles] = useState<FileList | undefined>(undefined);
    const [currentChatId, setCurrentChatId] = useState<Id<"ChatTable"> | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const createChatMutation = useMutation(api.chat.createChat);
    const deleteChatMutation = useMutation(api.chat.deleteChat);

    const getUserQuery = useQuery(api.chat.getUserByEmail,
        user?.emailAddresses?.[0]?.emailAddress ? { email: user.emailAddresses[0].emailAddress } : "skip"
    );

    const chatHistory = useQuery(api.chat.getChatHistory,
        getUserQuery ? { uid: getUserQuery._id } : "skip"
    );

    const currentChatMessages = useQuery(api.chat.loadChat,
        currentChatId && getUserQuery ? { chatId: currentChatId, uid: getUserQuery._id } : "skip"
    );

    const { messages, sendMessage, status, setMessages } = useChat({
        id: currentChatId || undefined,
        messages: currentChatMessages as UIMessage[] || [],
        transport: new DefaultChatTransport({
            api: '/api/chat/persistent',
            prepareSendMessagesRequest({ messages, id }) {
                return {
                    body: {
                        message: messages[messages.length - 1],
                        id,
                        uid: getUserQuery?._id,
                    },
                };
            },
        }),
    });

    const isLoading = status === 'streaming' || status === 'submitted';

    // Auto-select the first chat (don't create automatically)
    useEffect(() => {
        if (chatHistory && chatHistory.length > 0 && !currentChatId) {
            setCurrentChatId(chatHistory[0]._id);
        }
    }, [chatHistory, currentChatId]);

    // Update messages when switching chats
    useEffect(() => {
        if (currentChatMessages) {
            setMessages(currentChatMessages as UIMessage[]);
        }
    }, [currentChatMessages, setMessages]);

    // Handle escape key to close dropdown
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && showHistory) {
                setShowHistory(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [showHistory]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!input.trim() && (!files || files.length === 0)) return;
        if (!getUserQuery) return;

        // Create chat if none exists
        let chatId = currentChatId;
        if (!chatId) {
            try {
                chatId = await createChatMutation({ uid: getUserQuery._id });
                setCurrentChatId(chatId);
            } catch (error) {
                console.error("Failed to create chat:", error);
                return;
            }
        }

        const fileParts = files && files.length > 0 ? await convertFilesToDataURLs(files) : [];

        sendMessage({
            role: 'user',
            parts: [{ type: 'text', text: input }, ...fileParts],
        });

        setInput('');
        setFiles(undefined);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const createNewChat = () => {
        // Don't create in DB yet, just clear current chat
        setCurrentChatId(null);
        setMessages([]);
        setShowHistory(false);
    };

    const selectChat = (chatId: Id<"ChatTable">) => {
        setCurrentChatId(chatId);
        setShowHistory(false);
    };

    const deleteChat = async (chatId: Id<"ChatTable">, event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent selecting the chat
        if (!getUserQuery) return;

        try {
            await deleteChatMutation({ chatId, uid: getUserQuery._id });

            // If we deleted the current chat, switch to another or clear
            if (currentChatId === chatId) {
                const remainingChats = chatHistory?.filter(chat => chat._id !== chatId);
                if (remainingChats && remainingChats.length > 0) {
                    setCurrentChatId(remainingChats[0]._id);
                } else {
                    setCurrentChatId(null);
                    setMessages([]);
                }
            }
        } catch (error) {
            console.error("Failed to delete chat:", error);
        }
    };

    if (!isOpen) return null;

    const currentChat = chatHistory?.find(chat => chat._id === currentChatId);

    return (
        <div className={`fixed top-0 h-full w-96 bg-background border-l border-border shadow-lg z-50 flex flex-col transition-all duration-300 ${isTestPanelOpen ? 'right-96' : 'right-0'
            }`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Bot className="size-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold truncate">
                            {currentChat?.title || (currentChatId ? "Persistent Chat" : "New Chat")}
                        </h2>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {/* New Chat Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={createNewChat}
                        title="New Chat"
                        className="size-8"
                    >
                        <Plus className="size-4" />
                    </Button>

                    {/* History Dropdown */}
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowHistory(!showHistory)}
                            title="Chat History"
                            className="size-8"
                        >
                            <History className="size-4" />
                        </Button>

                        {showHistory && (
                            <div className="absolute right-0 top-full mt-1 w-80 bg-background border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                                <div className="p-2">
                                    <div className="text-xs font-medium text-muted-foreground mb-2">Chat History</div>
                                    {chatHistory?.length ? (
                                        chatHistory.map((chat) => (
                                            <div
                                                key={chat._id}
                                                className={`group flex items-center gap-2 p-2 rounded hover:bg-muted/50 text-sm ${currentChatId === chat._id ? 'bg-muted' : ''
                                                    }`}
                                            >
                                                <button
                                                    onClick={() => selectChat(chat._id)}
                                                    className="flex-1 text-left min-w-0"
                                                >
                                                    <div className="font-medium truncate">{chat.title}</div>
                                                    <div className="text-xs text-muted-foreground flex justify-between">
                                                        <span>{chat.messageCount} messages</span>
                                                        <span>{formatTimeAgo(chat._creationTime)}</span>
                                                    </div>
                                                </button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                                    onClick={(e) => deleteChat(chat._id, e)}
                                                    title="Delete chat"
                                                >
                                                    <Trash2 className="size-3" />
                                                </Button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-xs text-muted-foreground p-2">No chat history</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Close Button */}
                    <Button variant="ghost" size="icon" onClick={onClose} className="size-8">
                        <X className="size-4" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                        <Bot className="size-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">Hi! I'm your persistent AI assistant for ChalkTalk Studio.</p>
                        <p className="text-xs mt-2">I can help with presentations, analyze images/PDFs, and answer questions.</p>
                        <p className="text-xs mt-1 text-green-500">💾 All conversations are automatically saved!</p>
                        {!currentChatId && (
                            <p className="text-xs mt-2 text-blue-500">✨ Start typing to create a new chat!</p>
                        )}
                    </div>
                )}

                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                    >
                        {message.role === 'assistant' && (
                            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Bot className="size-4 text-primary" />
                            </div>
                        )}

                        <div
                            className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                                }`}
                        >
                            {message.parts.map((part, index) => {
                                if (part.type === 'text') {
                                    return (
                                        <div key={`${message.id}-text-${index}`} className="whitespace-pre-wrap text-sm">
                                            {part.text}
                                        </div>
                                    );
                                }
                                if (part.type === 'file' && part.mediaType?.startsWith('image/')) {
                                    return (
                                        <div key={`${message.id}-image-${index}`} className="mt-2">
                                            <Image
                                                src={part.url}
                                                width={200}
                                                height={200}
                                                alt={`attachment-${index}`}
                                                className="rounded-lg max-w-full h-auto"
                                            />
                                        </div>
                                    );
                                }
                                if (part.type === 'file' && part.mediaType === 'application/pdf') {
                                    return (
                                        <div key={`${message.id}-pdf-${index}`} className="mt-2">
                                            <div className="bg-background border rounded-lg p-3">
                                                <p className="text-xs text-muted-foreground mb-2">PDF Document</p>
                                                <iframe
                                                    src={part.url}
                                                    width="100%"
                                                    height="200"
                                                    title={`pdf-${index}`}
                                                    className="rounded border"
                                                />
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>

                        {message.role === 'user' && (
                            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <User className="size-4 text-primary" />
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3 justify-start">
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Bot className="size-4 text-primary" />
                        </div>
                        <div className="bg-muted rounded-lg p-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="size-4 animate-spin" />
                                AI is thinking...
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="border-t border-border p-4">
                <form onSubmit={handleSubmit} className="space-y-3">
                    {files && files.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {Array.from(files).map((file, index) => (
                                <div
                                    key={index}
                                    className="bg-muted rounded-lg p-2 text-xs flex items-center gap-2"
                                >
                                    <Paperclip className="size-3" />
                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={currentChatId ? "Ask me anything..." : "Start a new conversation..."}
                                className="pr-10"
                                disabled={isLoading}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 size-8"
                                onClick={handleFileSelect}
                                disabled={isLoading}
                            >
                                <Paperclip className="size-4" />
                            </Button>
                        </div>
                        <Button
                            type="submit"
                            size="icon"
                            disabled={isLoading || (!input.trim() && (!files || files.length === 0))}
                        >
                            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                        </Button>
                    </div>
                </form>
                <input
                    type="file"
                    accept="image/*,application/pdf"
                    ref={fileInputRef}
                    onChange={(event) => event.target.files && setFiles(event.target.files)}
                    multiple
                    className="hidden"
                />
            </div>
        </div>
    );
}
