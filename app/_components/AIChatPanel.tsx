'use client';

import React, { useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, Paperclip, Loader2, Bot, User, Zap, FileText, Plus, Code, Play } from 'lucide-react';
import Image from 'next/image';
import { getCurrentProjectId } from '@/utils/project';

interface EphemeralChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
    isTestPanelOpen?: boolean;
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

// Helper function to get tool icon
function getToolIcon(toolName: string) {
    switch (toolName) {
        case 'readDeck':
            return <FileText className="size-4" />;
        case 'readSlide':
            return <FileText className="size-4" />;
        case 'createSlide':
            return <Plus className="size-4" />;
        case 'replaceSlide':
            return <Code className="size-4" />;
        default:
            return <Play className="size-4" />;
    }
}

// Helper function to render tool calls
function renderToolCall(part: any, messageId: string, index: number) {
    const toolName = part.toolName || 'unknown';
    const toolIcon = getToolIcon(toolName);

    return (
        <div key={`${messageId}-tool-${index}`} className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
                {toolIcon}
                <span>Tool: {toolName}</span>
                <span className="text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                    {part.state || 'unknown'}
                </span>
            </div>

            {/* Tool Input */}
            {(part.state === 'input-available' || part.state === 'input-streaming') && part.input && (
                <div className="mb-2">
                    <div className="text-xs text-muted-foreground mb-1">Input:</div>
                    <pre className="text-xs bg-background/50 p-2 rounded border overflow-x-auto">
                        {JSON.stringify(part.input, null, 2)}
                    </pre>
                </div>
            )}

            {/* Tool Output */}
            {part.state === 'output-available' && part.output && (
                <div>
                    <div className="text-xs text-muted-foreground mb-1">Result:</div>
                    <div className="text-xs bg-green-50 dark:bg-green-950/20 p-2 rounded border">
                        {typeof part.output === 'string' ? (
                            <span className="text-green-700 dark:text-green-400">{part.output}</span>
                        ) : (
                            <pre className="text-green-700 dark:text-green-400 overflow-x-auto">
                                {JSON.stringify(part.output, null, 2)}
                            </pre>
                        )}
                    </div>
                </div>
            )}

            {/* Error */}
            {part.state === 'output-error' && part.errorText && (
                <div>
                    <div className="text-xs text-muted-foreground mb-1">Error:</div>
                    <div className="text-xs bg-red-50 dark:bg-red-950/20 p-2 rounded border text-red-700 dark:text-red-400">
                        {part.errorText}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function EphemeralChatPanel({ isOpen, onClose, isTestPanelOpen = false }: EphemeralChatPanelProps) {
    const [input, setInput] = useState('');
    const [files, setFiles] = useState<FileList | undefined>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { messages, sendMessage, status, setMessages } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat/ephemeral',
            prepareSendMessagesRequest({ messages }) {
                const projectId = getCurrentProjectId();
                return {
                    body: {
                        messages,
                        projectId,
                    },
                };
            },
        }),
    });

    const isLoading = status === 'streaming' || status === 'submitted';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!input.trim() && (!files || files.length === 0)) return;

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

    if (!isOpen) return null;

    return (
        <div className={`fixed top-0 h-full w-96 bg-background border-l border-border shadow-lg z-50 flex flex-col transition-all duration-300 ${isTestPanelOpen ? 'right-96' : 'right-0'
            }`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <Zap className="size-5 text-primary" />
                    <h2 className="text-lg font-semibold">Ephemeral AI Chat</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="size-4" />
                </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                        <Zap className="size-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">Hi! I'm your ephemeral AI assistant for ChalkTalk Studio.</p>
                        <p className="text-xs mt-2">I can help with presentations, analyze images/PDFs, and answer questions.</p>
                        <p className="text-xs mt-1 text-orange-500">⚡ Note: This chat is not saved - use the 🤖 button for persistent chats!</p>
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
                                // Handle tool calls
                                if (part.type === 'tool-readDeck' || part.type === 'tool-readSlide' ||
                                    part.type === 'tool-createSlide' || part.type === 'tool-replaceSlide') {
                                    return renderToolCall(part, message.id, index);
                                }
                                // Handle dynamic tools
                                if (part.type === 'dynamic-tool') {
                                    return renderToolCall(part, message.id, index);
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
                    {/* File Preview */}
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

                    {/* Input Row */}
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask me anything about your presentation..."
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
                        <Button type="submit" size="icon" disabled={isLoading || (!input.trim() && (!files || files.length === 0))}>
                            {isLoading ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Send className="size-4" />
                            )}
                        </Button>
                    </div>
                </form>

                {/* Hidden File Input */}
                <input
                    type="file"
                    accept="image/*,application/pdf"
                    ref={fileInputRef}
                    onChange={(event) => {
                        if (event.target.files) {
                            setFiles(event.target.files);
                        }
                    }}
                    multiple
                    className="hidden"
                />
            </div>
        </div>
    );
}
