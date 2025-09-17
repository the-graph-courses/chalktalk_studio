'use client';

import React, { useRef, useState, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, Paperclip, Loader2, Bot, User, Zap, FileText, Plus, Code, Play, Settings, ChevronDown, ChevronUp, Upload, Brain, Trash2, AlertTriangle, Square, RefreshCcw } from 'lucide-react';
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

// Helper component for collapsible content
function CollapsibleContent({
    content,
    maxLines = 5,
    className = ""
}: {
    content: string;
    maxLines?: number;
    className?: string;
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Count lines in content
    const lines = content.split('\n');
    const shouldCollapse = lines.length > maxLines;

    const displayContent = shouldCollapse && !isExpanded
        ? lines.slice(0, maxLines).join('\n') + '\n...'
        : content;

    if (!shouldCollapse) {
        return <pre className={className}>{content}</pre>;
    }

    return (
        <div>
            <pre className={className}>{displayContent}</pre>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
                {isExpanded ? (
                    <>
                        <ChevronUp className="size-3" />
                        Show less
                    </>
                ) : (
                    <>
                        <ChevronDown className="size-3" />
                        Show {lines.length - maxLines} more lines
                    </>
                )}
            </button>
        </div>
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
        case 'deleteSlide':
            return <Trash2 className="size-4" />;
        default:
            return <Play className="size-4" />;
    }
}

// Helper function to execute editor commands
function executeEditorCommand(output: any): any {
    if (typeof window === 'undefined') return false;

    // @ts-ignore - Access global grapesjsAITools
    const aiTools = window.grapesjsAITools;
    if (!aiTools || !output?.command) return false;

    const { command, data: commandData } = output;

    try {
        switch (command) {
            case 'addSlide':
                return aiTools.addSlide(
                    commandData.name,
                    commandData.content,
                    commandData.insertAtIndex
                );
            case 'replaceSlide':
                return aiTools.replaceSlide(
                    commandData.slideIndex,
                    commandData.newContent,
                    commandData.newName
                );
            case 'deleteSlide':
                return aiTools.deleteSlide(
                    commandData.slideIndex
                );
            case 'readSlide': {
                const html = aiTools.getSlideHtml(commandData.slideIndex);
                const css = aiTools.getSlideCss(commandData.slideIndex);

                if (html === null || css === null) {
                    return { error: `Slide ${commandData.slideIndex} not found` };
                }

                const editor = aiTools.getEditor();
                const pages = editor?.Pages?.getAll();
                const page = pages?.[commandData.slideIndex];
                const slideName = page?.getName() || page?.getId() || `Slide ${commandData.slideIndex + 1}`;

                return {
                    success: true,
                    slideIndex: commandData.slideIndex,
                    slideName,
                    html,
                    css
                };
            }
            case 'readDeck': {
                const slidesData = aiTools.getAllSlidesHtmlCss();
                if (!slidesData) return { error: 'Failed to read slides' };

                const slides = slidesData.map(slide => ({
                    index: slide.index,
                    name: commandData.includeNames ? slide.name : undefined,
                    html: slide.html,
                    css: slide.css
                }));

                return {
                    success: true,
                    totalSlides: slides.length,
                    slides
                };
            }
            default:
                return false;
        }
    } catch (error) {
        console.error('Error executing editor command:', error);
        return false;
    }
}

// Helper function to render tool calls
function renderToolCall(part: any, messageId: string, index: number, executedCommandIds: Set<string>) {
    // Extract tool name from part.type or part.toolName
    let toolName = 'unknown';
    if (part.toolName) {
        toolName = part.toolName;
    } else if (part.type && part.type.startsWith('tool-')) {
        toolName = part.type.replace('tool-', '');
    } else if (part.type === 'dynamic-tool' && part.toolCall?.toolName) {
        toolName = part.toolCall.toolName;
    }

    const toolIcon = getToolIcon(toolName);

    const toolCallId = `${messageId}-tool-${index}`;
    const commandExecuted = executedCommandIds.has(toolCallId);

    return (
        <div key={`${messageId}-tool-${index}`} className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
                {toolIcon}
                <span>Tool: {toolName}</span>
                <span className="text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                    {part.state || 'unknown'}
                </span>
                {commandExecuted && (
                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                        ✓ Executed
                    </span>
                )}
            </div>

            {/* Tool Input */}
            {(part.state === 'input-available' || part.state === 'input-streaming') && part.input && (
                <div className="mb-2">
                    <div className="text-xs text-muted-foreground mb-1">Input:</div>
                    <CollapsibleContent
                        content={JSON.stringify(part.input, null, 2)}
                        className="text-xs bg-background/50 p-2 rounded border overflow-x-auto"
                        maxLines={6}
                    />
                </div>
            )}

            {/* Tool Output */}
            {part.state === 'output-available' && part.output && (
                <div>
                    <div className="text-xs text-muted-foreground mb-1">Result:</div>
                    <div className="text-xs bg-green-50 dark:bg-green-950/20 p-2 rounded border">
                        {commandExecuted ? (
                            <div className="text-green-700 dark:text-green-400">
                                {part.output.command === 'readSlide' || part.output.command === 'readDeck' ?
                                    'Data retrieved successfully' :
                                    (part.output.message || 'Command executed successfully')}
                            </div>
                        ) : part.output.html || part.output.slideContent ? (
                            // Show HTML and CSS for slide reads
                            <div className="text-green-700 dark:text-green-400">
                                <div className="text-xs text-muted-foreground mb-1">
                                    {part.output.slideName ? `Slide: ${part.output.slideName}` : 'Slide'}
                                    {part.output.slideIndex !== undefined ? ` (Index: ${part.output.slideIndex})` : ''}
                                </div>

                                {part.output.html && part.output.css ? (
                                    // New format with separate HTML and CSS
                                    <div className="space-y-2 mt-1">
                                        <div>
                                            <div className="text-xs font-medium mb-1">HTML:</div>
                                            <CollapsibleContent
                                                content={part.output.html}
                                                className="overflow-x-auto whitespace-pre-wrap text-xs bg-background/50 p-2 rounded border"
                                                maxLines={8}
                                            />
                                        </div>
                                        <div>
                                            <div className="text-xs font-medium mb-1">CSS:</div>
                                            <CollapsibleContent
                                                content={part.output.css}
                                                className="overflow-x-auto whitespace-pre-wrap text-xs bg-background/50 p-2 rounded border"
                                                maxLines={6}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    // Fallback to old format
                                    <CollapsibleContent
                                        content={part.output.slideContent}
                                        className="overflow-x-auto whitespace-pre-wrap text-xs bg-background/50 p-2 rounded border mt-1"
                                        maxLines={10}
                                    />
                                )}
                            </div>
                        ) : part.output.slides ? (
                            // Show clean content for deck reads
                            <div className="text-green-700 dark:text-green-400">
                                <div className="text-xs text-muted-foreground mb-1">
                                    Total Slides: {part.output.totalSlides}
                                </div>
                                <div className="space-y-2 mt-1">
                                    {part.output.slides.map((slide: any, idx: number) => (
                                        <div key={idx} className="bg-background/50 p-2 rounded border">
                                            <div className="text-xs font-medium mb-1">
                                                Slide {slide.index}: {slide.name}
                                            </div>

                                            {slide.html && slide.css ? (
                                                // New format with separate HTML and CSS
                                                <div className="space-y-1">
                                                    <div>
                                                        <div className="text-xs font-medium mb-1">HTML:</div>
                                                        <CollapsibleContent
                                                            content={slide.html}
                                                            className="text-xs overflow-x-auto whitespace-pre-wrap bg-background/50 p-1 rounded border"
                                                            maxLines={6}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-medium mb-1">CSS:</div>
                                                        <CollapsibleContent
                                                            content={slide.css}
                                                            className="text-xs overflow-x-auto whitespace-pre-wrap bg-background/50 p-1 rounded border"
                                                            maxLines={4}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                // Fallback to old format
                                                <CollapsibleContent
                                                    content={slide.content}
                                                    className="text-xs overflow-x-auto whitespace-pre-wrap"
                                                    maxLines={8}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : typeof part.output === 'string' ? (
                            <span className="text-green-700 dark:text-green-400">{part.output}</span>
                        ) : (
                            <CollapsibleContent
                                content={JSON.stringify(part.output, null, 2)}
                                className="text-green-700 dark:text-green-400 overflow-x-auto"
                                maxLines={10}
                            />
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
    const [executedCommandIds, setExecutedCommandIds] = useState<Set<string>>(new Set());
    const [showSettings, setShowSettings] = useState(false);
    const [preferAbsolutePositioning, setPreferAbsolutePositioning] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedModel, setSelectedModel] = useState('claude-sonnet-4');
    const [showModelPicker, setShowModelPicker] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);
    const modelPickerRef = useRef<HTMLDivElement>(null);

    const { messages, sendMessage, status, setMessages, stop } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat/ephemeral',
        }),
    });

    const isLoading = status === 'streaming' || status === 'submitted';

    // Available AI models
    const models = [
        { id: 'cerebras', name: 'Qwen 3 480B', icon: '🧠', description: 'Cerebras' },
        { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', icon: '🎭', description: 'Anthropic' },
        { id: 'gpt-4o', name: 'GPT-4o', icon: '🤖', description: 'OpenAI' },
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Close dropdowns when clicking outside
    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setShowSettings(false);
            }
            if (modelPickerRef.current && !modelPickerRef.current.contains(event.target as Node)) {
                setShowModelPicker(false);
            }
        }

        if (showSettings || showModelPicker) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showSettings, showModelPicker]);

    // Execute tool commands once when output becomes available
    React.useEffect(() => {
        for (const message of messages) {
            if (message.role === 'assistant') {
                message.parts?.forEach((part: any, index: number) => {
                    const toolCallId = `${message.id}-tool-${index}`;
                    if (
                        (part.type?.startsWith?.('tool-') || part.type === 'dynamic-tool') &&
                        part.state === 'output-available' &&
                        part.output?.command &&
                        !executedCommandIds.has(toolCallId)
                    ) {
                        const executed = executeEditorCommand(part.output);
                        if (executed) {
                            // For read commands, update the output with the actual data
                            if (part.output.command === 'readSlide' || part.output.command === 'readDeck') {
                                part.output = executed;
                            } else {
                                // For write commands, trigger a save to persist the state
                                if (window.grapesjsAITools?.getEditor) {
                                    const editor = window.grapesjsAITools.getEditor();
                                    editor?.store();
                                }
                            }

                            setExecutedCommandIds(prev => {
                                const next = new Set(prev);
                                next.add(toolCallId);
                                return next;
                            });
                        }
                    }
                });
            }
        }
    }, [messages, executedCommandIds]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!input.trim() && (!files || files.length === 0)) return;

        // At the start of a new conversation, save the current editor state
        // to ensure the AI has the latest version of the presentation.
        if (messages.length === 0) {
            if (window.grapesjsAITools?.getEditor) {
                const editor = window.grapesjsAITools.getEditor();
                editor?.store();
            }
        }

        const fileParts = files && files.length > 0 ? await convertFilesToDataURLs(files) : [];

        sendMessage({
            role: 'user',
            parts: [{ type: 'text', text: input }, ...fileParts],
        }, {
            body: {
                projectId: getCurrentProjectId(),
                model: selectedModel,
                preferences: {
                    preferAbsolutePositioning,
                },
            },
        });

        setInput('');
        setFiles(undefined);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleNewChat = () => {
        stop();
        setMessages([]);
        setExecutedCommandIds(new Set());
        setInput('');
        setFiles(undefined);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    // Drag and drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set drag over to false if we're leaving the entire chat panel
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles && droppedFiles.length > 0) {
            // Filter for supported file types
            const supportedFiles = Array.from(droppedFiles).filter(file =>
                file.type.startsWith('image/') || file.type === 'application/pdf'
            );

            if (supportedFiles.length > 0) {
                // Create a new FileList-like object
                const fileList = supportedFiles.reduce((acc, file, index) => {
                    acc[index] = file;
                    return acc;
                }, {} as any);
                fileList.length = supportedFiles.length;

                setFiles(fileList as FileList);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className={`fixed top-0 h-full w-96 bg-background border-l border-border shadow-lg z-50 transition-all duration-300 ${isTestPanelOpen ? 'right-96' : 'right-0'
                } ${isDragOver ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="relative h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <Zap className="size-5 text-primary" />
                        <h2 className="text-lg font-semibold">Chat</h2>
                    </div>
                    <div className="flex items-center gap-1">
                        {/* New Chat Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleNewChat}
                            disabled={isLoading}
                            title="Start New Chat"
                        >
                            <RefreshCcw className="size-4" />
                        </Button>
                        {/* Model Picker */}
                        <div className="relative" ref={modelPickerRef}>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowModelPicker(!showModelPicker)}
                                className="text-xs font-medium"
                                disabled={isLoading}
                                title="Select AI Model"
                            >
                                <Brain className="size-3 mr-1" />
                                {models.find(m => m.id === selectedModel)?.icon} {models.find(m => m.id === selectedModel)?.name}
                                <ChevronDown className="size-3 ml-1" />
                            </Button>
                            {showModelPicker && (
                                <div className="absolute right-0 top-full mt-1 w-72 bg-background border border-border rounded-md shadow-lg z-10">
                                    <div className="p-2">
                                        <div className="text-sm font-medium mb-2 px-2">Select AI Model</div>
                                        {models.map((model) => (
                                            <button
                                                key={model.id}
                                                onClick={() => {
                                                    setSelectedModel(model.id);
                                                    setShowModelPicker(false);
                                                }}
                                                disabled={isLoading}
                                                className={`w-full flex items-center gap-3 p-2 rounded hover:bg-muted text-left transition-colors ${selectedModel === model.id ? 'bg-muted' : ''
                                                    }`}
                                            >
                                                <span className="text-lg">{model.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium truncate">{model.name}</div>
                                                    <div className="text-xs text-muted-foreground">{model.description}</div>
                                                </div>
                                                {selectedModel === model.id && (
                                                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Settings Dropdown */}
                        <div className="relative" ref={settingsRef}>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowSettings(!showSettings)}
                                className={`relative ${preferAbsolutePositioning ? 'text-primary' : ''}`}
                                title="AI Generation Settings"
                            >
                                <Settings className="size-4" />
                                {preferAbsolutePositioning && (
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                                )}
                            </Button>
                            {showSettings && (
                                <div className="absolute right-0 top-full mt-1 w-64 bg-background border border-border rounded-md shadow-lg z-10">
                                    <div className="p-3">
                                        <div className="text-sm font-medium mb-2">AI Generation Settings</div>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={preferAbsolutePositioning}
                                                onChange={(e) => setPreferAbsolutePositioning(e.target.checked)}
                                                className="rounded border-border"
                                            />
                                            <div className="flex-1">
                                                <div className="text-sm">Prefer Absolute Positioning</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Guide AI to use absolute positioning and avoid nested divs
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="size-4" />
                        </Button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                            <Zap className="size-12 mx-auto mb-4 opacity-50" />
                            <p className="text-sm">Hi! I'm your ephemeral AI assistant for ChalkTalk Studio.</p>
                            <p className="text-xs mt-2">I can help with presentations, analyze images/PDFs, and answer questions.</p>
                            <p className="text-xs mt-1 flex items-center justify-center gap-1">
                                <Brain className="size-3" />
                                Current model: {models.find(m => m.id === selectedModel)?.icon} {models.find(m => m.id === selectedModel)?.name}
                            </p>
                            <p className="text-xs mt-1 text-orange-500">⚡ Note: This chat is not saved and will be lost when you close it.</p>
                        </div>
                    )}

                    {messages.map((message, index) => (
                        <div
                            key={message.id || `message-${index}`}
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
                                    if (part.type?.startsWith('tool-') || part.type === 'dynamic-tool') {
                                        return renderToolCall(part, message.id, index, executedCommandIds);
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
                            <div className="flex-1 relative flex items-center">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask me anything about your presentation..."
                                    className="pr-10 h-10"
                                    disabled={isLoading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1 h-8 w-8 p-0 hover:bg-transparent"
                                    onClick={handleFileSelect}
                                    disabled={isLoading}
                                    title="Upload image or PDF"
                                >
                                    <Paperclip className="size-4" />
                                </Button>
                            </div>
                            {isLoading ? (
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="destructive"
                                    onClick={() => stop()}
                                    title="Stop AI response"
                                >
                                    <Square className="size-4 fill-current" />
                                </Button>
                            ) : (
                                <Button type="submit" size="icon" disabled={!input.trim() && (!files || files.length === 0)}>
                                    <Send className="size-4" />
                                </Button>
                            )}
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

                {/* Drag and Drop Overlay */}
                {isDragOver && (
                    <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg border-2 border-dashed border-blue-500 text-center">
                            <Upload className="size-12 mx-auto mb-4 text-blue-500" />
                            <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-2">
                                Drop files here
                            </h3>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                Upload images (PNG, JPG, GIF) or PDF files
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
