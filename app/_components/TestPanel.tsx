'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { X, Play, Loader2, CheckCircle, XCircle, Settings } from 'lucide-react'

interface TestResult {
    success: boolean
    data: any
    timestamp: string
    error?: string
}

interface TestPanelProps {
    isOpen: boolean
    onClose: () => void
}

const testEndpoints = [
    {
        id: 'read-deck',
        name: 'Read Deck',
        description: 'Read entire slide deck with optional names',
        icon: '📖',
        method: 'POST',
        path: '/api/ai/tests/read-deck',
        hasParams: true,
        params: {
            projectId: 'project_5ixc4na0jc4_1757422475707',
            includeNames: true
        }
    },
    {
        id: 'read-slide',
        name: 'Read Slide',
        description: 'Read specific slide by index',
        icon: '📄',
        method: 'POST',
        path: '/api/ai/tests/read-slide',
        hasParams: true,
        params: {
            projectId: 'project_5ixc4na0jc4_1757422475707',
            slideIndex: 0
        }
    },
    {
        id: 'create-slide',
        name: 'New Slide',
        description: 'Create new slide with rich content at specified position (-1 for end)',
        icon: '➕',
        method: 'POST',
        path: '/api/ai/tests/create-slide',
        hasParams: true,
        params: {
            projectId: 'project_5ixc4na0jc4_1757422475707',
            name: 'Test Panel Generated Slide',
            content: `<div style="position: relative; width: 800px; height: 500px; margin: 70px auto 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); overflow: hidden;">
  <h1 style="position: absolute; top: 50px; left: 50px; font-size: 48px; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">Test Panel Slide</h1>
  
  <p style="position: absolute; top: 130px; left: 50px; font-size: 22px; max-width: 550px; line-height: 1.5; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">This slide was created from the Test Panel with editable rich content. You can modify this content in the parameters section.</p>
  
  <div style="position: absolute; bottom: 50px; left: 50px; padding: 15px 25px; background: rgba(255,255,255,0.2); border-radius: 8px; backdrop-filter: blur(10px);">
    <span style="font-size: 16px; font-weight: 600;">🧪 Test Panel</span>
  </div>
  
  <div class="gjs-icon" style="position: absolute; bottom: 50px; right: 50px; width: 80px; height: 80px; opacity: 0.7;">
    <svg style="width: 100%; height: 100%;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4m-6 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-6 0h6"></path>
    </svg>
  </div>
</div>`,
            insertAtIndex: -1
        }
    },
    {
        id: 'replace-slide',
        name: 'replace Slide',
        description: 'replace existing slide content and name',
        icon: '✏️',
        method: 'POST',
        path: '/api/ai/tests/replace-slide',
        hasParams: true,
        params: {
            projectId: 'project_5ixc4na0jc4_1757422475707',
            slideIndex: 0,
            newName: 'Test Panel Replaced Slide',
            newContent: `<div style="position: relative; width: 800px; height: 500px; margin: 70px auto 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); overflow: hidden;">
  <h1 style="position: absolute; top: 50px; left: 50px; font-size: 48px; font-weight: 700;">Custom Test Content</h1>
  <p style="position: absolute; top: 130px; left: 50px; font-size: 22px; max-width: 550px; line-height: 1.5;">This is customizable content from the Test Panel. You can edit this text to test different slide content.</p>
  <div style="position: absolute; bottom: 50px; right: 50px; width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
    <span style="font-size: 24px;">✨</span>
  </div>
</div>`
        }
    }
]

export default function TestPanel({ isOpen, onClose }: TestPanelProps) {
    const [loading, setLoading] = useState<string | null>(null)
    const [results, setResults] = useState<Record<string, TestResult>>({})
    const [expandedParams, setExpandedParams] = useState<Record<string, boolean>>({})
    const [customParams, setCustomParams] = useState<Record<string, any>>({})

    const runTest = async (endpoint: typeof testEndpoints[0]) => {
        setLoading(endpoint.id)

        try {
            const params = customParams[endpoint.id] || endpoint.params || {}
            const hasContent = endpoint.hasParams && Object.keys(params).length > 0

            const response = await fetch(endpoint.path, {
                method: endpoint.method,
                headers: hasContent ? { 'Content-Type': 'application/json' } : {},
                body: hasContent ? JSON.stringify(params) : undefined,
            })

            const data = await response.json()

            // Execute command on editor if present
            let commandExecuted = false
            if (data.success && data.result?.command && typeof window !== 'undefined') {
                // @ts-ignore - Access global grapesjsAITools
                const aiTools = window.grapesjsAITools
                if (aiTools) {
                    const { command, data: commandData } = data.result
                    try {
                        switch (command) {
                            case 'addSlide':
                                commandExecuted = aiTools.addSlide(
                                    commandData.name,
                                    commandData.content,
                                    commandData.insertAtIndex
                                )
                                break
                            case 'replaceSlide':
                                commandExecuted = aiTools.replaceSlide(
                                    commandData.slideIndex,
                                    commandData.newContent,
                                    commandData.newName
                                )
                                break
                        }
                    } catch (error) {
                        console.error('Error executing replaceor command:', error)
                    }
                }
            }

            setResults(prev => ({
                ...prev,
                [endpoint.id]: {
                    success: data.success || response.ok,
                    data: { ...data, commandExecuted },
                    timestamp: new Date().toISOString(),
                    error: data.error
                }
            }))
        } catch (error) {
            setResults(prev => ({
                ...prev,
                [endpoint.id]: {
                    success: false,
                    data: null,
                    timestamp: new Date().toISOString(),
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            }))
        } finally {
            setLoading(null)
        }
    }

    const runAllTests = async () => {
        setLoading('all')
        for (const endpoint of testEndpoints) {
            await runTest(endpoint)
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 500))
        }
        setLoading(null)
    }

    const toggleParams = (endpointId: string) => {
        setExpandedParams(prev => ({
            ...prev,
            [endpointId]: !prev[endpointId]
        }))
    }

    const updateParam = (endpointId: string, paramKey: string, value: any) => {
        setCustomParams(prev => ({
            ...prev,
            [endpointId]: {
                ...prev[endpointId],
                [paramKey]: value
            }
        }))
    }

    const resetParams = (endpointId: string) => {
        setCustomParams(prev => {
            const updated = { ...prev }
            delete updated[endpointId]
            return updated
        })
    }

    if (!isOpen) return null

    return (
        <div className="fixed right-0 top-0 h-full w-96 bg-background border-l border-border shadow-lg z-50 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <Settings className="size-5 text-primary" />
                    <h2 className="text-lg font-semibold">AI Tests Panel</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="size-4" />
                </Button>
            </div>

            {/* Controls */}
            <div className="p-4 border-b border-border">
                <Button
                    onClick={runAllTests}
                    disabled={loading === 'all'}
                    className="w-full"
                    size="sm"
                >
                    {loading === 'all' ? (
                        <>
                            <Loader2 className="size-4 animate-spin" />
                            Running All Tests...
                        </>
                    ) : (
                        <>
                            <Play className="size-4" />
                            Run All Tests
                        </>
                    )}
                </Button>
            </div>

            {/* Test List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {testEndpoints.map((endpoint) => {
                    const result = results[endpoint.id]
                    const isLoading = loading === endpoint.id
                    const params = customParams[endpoint.id] || endpoint.params || {}
                    const isParamsExpanded = expandedParams[endpoint.id]

                    return (
                        <div key={endpoint.id} className="border border-border rounded-lg p-3 space-y-2">
                            {/* Test Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{endpoint.icon}</span>
                                    <div>
                                        <h3 className="font-medium text-sm">{endpoint.name}</h3>
                                        <p className="text-xs text-muted-foreground">{endpoint.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {result && (
                                        result.success ? (
                                            <CheckCircle className="size-4 text-green-500" />
                                        ) : (
                                            <XCircle className="size-4 text-red-500" />
                                        )
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => runTest(endpoint)}
                                        disabled={isLoading}
                                        className="h-7 px-2"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="size-3 animate-spin" />
                                        ) : (
                                            <Play className="size-3" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Parameters */}
                            {endpoint.hasParams && (
                                <div className="space-y-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleParams(endpoint.id)}
                                        className="h-6 px-2 text-xs"
                                    >
                                        {isParamsExpanded ? 'Hide' : 'Show'} Parameters
                                    </Button>

                                    {isParamsExpanded && (
                                        <div className="space-y-2 p-2 bg-muted/50 rounded border">
                                            {Object.entries(endpoint.params).map(([key, defaultValue]) => (
                                                <div key={key} className="space-y-1">
                                                    <label className="text-xs font-medium">{key}</label>
                                                    {typeof defaultValue === 'boolean' ? (
                                                        <div className="flex items-center space-x-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={params[key] !== undefined ? params[key] : defaultValue}
                                                                onChange={(e) => updateParam(endpoint.id, key, e.target.checked)}
                                                                className="h-4 w-4"
                                                            />
                                                            <span className="text-xs">{String(defaultValue)}</span>
                                                        </div>
                                                    ) : typeof defaultValue === 'string' && (key === 'message' || key === 'content' || key === 'newContent') ? (
                                                        <Textarea
                                                            value={params[key] !== undefined ? params[key] : defaultValue}
                                                            onChange={(e) => updateParam(endpoint.id, key, e.target.value)}
                                                            className="h-16 text-xs"
                                                            placeholder={String(defaultValue)}
                                                        />
                                                    ) : (
                                                        <Input
                                                            value={params[key] !== undefined ? params[key] : defaultValue}
                                                            onChange={(e) => {
                                                                const value = typeof defaultValue === 'number'
                                                                    ? parseInt(e.target.value) || 0
                                                                    : e.target.value
                                                                updateParam(endpoint.id, key, value)
                                                            }}
                                                            type={typeof defaultValue === 'number' ? 'number' : 'text'}
                                                            className="h-7 text-xs"
                                                            placeholder={String(defaultValue)}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => resetParams(endpoint.id)}
                                                className="h-6 px-2 text-xs"
                                            >
                                                Reset to Defaults
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Result */}
                            {result && (
                                <div className="text-xs space-y-1">
                                    <div className={`p-2 rounded border ${result.success
                                        ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                                        : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                                        }`}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={result.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                                                {result.success ? 'Success' : 'Failed'}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {new Date(result.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        {result.error && (
                                            <p className="text-red-600 dark:text-red-400 font-mono">
                                                {result.error}
                                            </p>
                                        )}
                                        {result.data && (
                                            <>
                                                {/* Special handling for chat responses */}
                                                {endpoint.id === 'chat' && result.data.result?.fullResponse && (
                                                    <div className="mt-2 p-2 bg-background rounded border">
                                                        <h4 className="text-xs font-medium mb-1 text-foreground">AI Response:</h4>
                                                        <div className="text-xs text-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
                                                            {result.data.result.fullResponse}
                                                        </div>
                                                    </div>
                                                )}

                                                <details className="mt-2">
                                                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                                        View Full Response Data
                                                    </summary>
                                                    <pre className="mt-1 p-2 bg-background rounded border overflow-x-auto text-xs font-mono max-h-40 overflow-y-auto">
                                                        {JSON.stringify(result.data, null, 2)}
                                                    </pre>
                                                </details>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
