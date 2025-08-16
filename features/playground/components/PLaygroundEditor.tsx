"use client"

import { useRef, useEffect, useCallback } from "react"
import Editor, { type Monaco } from "@monaco-editor/react"
import { configureMonaco, defaultEditorOptions, getEditorLanguage } from "@/features/playground/lib/editor-config"
import type { TemplateFile } from "@/features/playground/lib/path-to-json"

interface PlaygroundEditorProps {
    activeFile: TemplateFile | undefined
    content: string
    onContentChange: (value: string) => void
    suggestion: string | null
    suggestionLoading: boolean
    suggestionPosition: { line: number; column: number } | null
    onAcceptSuggestion: (editor: any, monaco: any) => void
    onRejectSuggestion: (editor: any) => void
    onTriggerSuggestion: (type: string, editor: any) => void
}

export const PlaygroundEditor = ({
    activeFile,
    content,
    onContentChange,
    suggestion,
    suggestionLoading,
    suggestionPosition,
    onAcceptSuggestion,
    onRejectSuggestion,
    onTriggerSuggestion,
}: PlaygroundEditorProps) => {
    const editorRef = useRef<any>(null)
    const monacoRef = useRef<Monaco | null>(null)
    const inlineCompletionProviderRef = useRef<any>(null)
    const currentSuggestionRef = useRef<{
        text: string
        position: { line: number; column: number }
        id: string
    } | null>(null)
    const isAcceptingSuggestionRef = useRef(false)
    const suggestionAcceptedRef = useRef(false)
    const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const tabCommandRef = useRef<any>(null)

    // Generate unique ID for each suggestion
    const generateSuggestionId = () => `suggestion-${Date.now()}-${Math.random()}`

    // Create inline completion provider
    const createInlineCompletionProvider = useCallback((monaco: Monaco) => ({
        provideInlineCompletions: (model: any, position: any) => {
            if (!suggestion || isAcceptingSuggestionRef.current || suggestionAcceptedRef.current) {
                return Promise.resolve({ items: [] });
            }

            const suggestionId = generateSuggestionId();
            currentSuggestionRef.current = {
                text: suggestion,
                position: suggestionPosition || {line: position.lineNumber, column: position.column},
                id: suggestionId
            }

            const cleanSuggestion = suggestion.replace(/\r/g, "")

            // Calculate the end position based on the suggestion text
            const lines = cleanSuggestion.split('\n');
            const endLineNumber = position.lineNumber + lines.length - 1;
            const endColumn = lines.length > 1 
                ? lines[lines.length - 1].length + 1
                : position.column + cleanSuggestion.length;

            return Promise.resolve({
                items: [
                    {
                        insertText: cleanSuggestion,
                        range: new monaco.Range(
                            position.lineNumber,
                            position.column,
                            endLineNumber,
                            endColumn
                        ),
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        label: "AI Suggestion",
                        detail: "AI generated suggestion",
                        documentation: "Press Tab to accept",
                        sortText: "0000",
                        filterText: "",
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.KeepWhitespace
                    }
                ]
            })
        },
        freeInlineCompletions: () => { },

    }), [suggestion])

    // Clear current suggestion
    const clearCurrentSuggestion = useCallback(() => {
        console.log("Clearing current suggestion")
        currentSuggestionRef.current = null
        suggestionAcceptedRef.current = false
        // No direct "hide" command in Monaco, clearing internal state is sufficient
        // The UI elements will automatically disappear when state changes
    }, [])

    // Accept current suggestion with double-acceptance prevention
    const acceptCurrentSuggestion = useCallback(() => {
        // Early returns for various failure conditions
        if (!editorRef.current || !monacoRef.current || !currentSuggestionRef.current) return false;
        if (isAcceptingSuggestionRef.current || suggestionAcceptedRef.current) return false;

        // Set flags to prevent multiple executions
        isAcceptingSuggestionRef.current = true;
        suggestionAcceptedRef.current = true;

        try {
            const editor = editorRef.current
            const monaco = monacoRef.current
            const cleanSuggestionText = currentSuggestionRef.current.text.replace(/\r/g, "")
            const position = editor.getPosition()

            // Check if suggestion is already at cursor position
            const modelTextAtCursor = editor.getModel().getValueInRange(
                new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column + cleanSuggestionText.length)
            )
            if (modelTextAtCursor === cleanSuggestionText) {
                console.log("Suggestions already accepted")
                return false;
            }

            // Insert the suggestion text
            const range = new monaco.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column
            )

            editor.executeEdits("ai-suggestion", [
                { range, text: cleanSuggestionText, forceMoveMarkers: true }
            ])

            // Calculate end position after insertion
            const lines = cleanSuggestionText.split("\n")
            const endLine = position.lineNumber + lines.length - 1
            const endColumn = lines.length === 1 ? position.column + cleanSuggestionText.length : lines[lines.length - 1].length + 1

            // Move cursor to end of inserted text
            editor.setPosition({
                lineNumber: endLine,
                column: endColumn
            })

            // Clear current suggestion state
            clearCurrentSuggestion()

            // Notify parent component
            onAcceptSuggestion(editor, monaco)

            return true;

        } catch (error) {
            console.log(error)
            return false;
        }
        finally {
            // Reset accepting flag immediately
            isAcceptingSuggestionRef.current = false
            // Reset accepted flag after a delay to prevent repeated triggers
            setTimeout(() => {
                if (suggestionAcceptedRef.current) {
                    suggestionAcceptedRef.current = false
                }
            }, 1000)
        }
    }, [clearCurrentSuggestion, onAcceptSuggestion])

    // Check if there's an active inline suggestion at current position
    const hasActiveSuggestionAtPosition = useCallback(() => {
        if (!editorRef.current || !currentSuggestionRef.current) return false

        const position = editorRef.current.getPosition()
        const suggestion = currentSuggestionRef.current

        return (
            position.lineNumber === suggestion.position.line &&
            position.column >= suggestion.position.column &&
            position.column <= suggestion.position.column + suggestion.text.length
        )
    }, [])

    // Update inline completions when suggestion changes
    useEffect(() => {
        if (!editorRef.current || !monacoRef.current) return

        if (inlineCompletionProviderRef.current) {
            inlineCompletionProviderRef.current.dispose()
        }

        if (suggestion) {
            const language = getEditorLanguage(activeFile?.fileExtension || "")

            const provider = createInlineCompletionProvider(monacoRef.current)

            inlineCompletionProviderRef.current = monacoRef.current.languages.registerInlineCompletionsProvider(language, provider)

            // Trigger Monaco's built-in suggest action instead of invalid inlineSuggest.show
            setTimeout(() => {
                if (editorRef.current) {
                    editorRef.current.trigger("editor", "editor.action.triggerSuggest", {});
                }
            }, 100)
        }

        return () => {
            if (inlineCompletionProviderRef.current) {
                inlineCompletionProviderRef.current.dispose()
                inlineCompletionProviderRef.current = null
            }
        }

    }, [suggestion, activeFile, createInlineCompletionProvider])

    const handleEditorDidMount = (editor: any, monaco: Monaco) => {
        editorRef.current = editor
        monacoRef.current = monaco
        console.log("Editor instance mounted:", !!editorRef.current)
        console.log(editor.defaultEditorOptions)
        configureMonaco(monaco)
        editor.updateOptions({
            ...defaultEditorOptions,
            // Enable inline suggestions but with specific settings to prevent conflicts
            inlineSuggest: { enabled: true },
            // Disable some conflicting suggest features
            suggest: {
                preview: false, // Disable preview to avoid conflicts
                showInlineDetails: false,
                insertMode: "replace",
            },
            // Quick suggestions
            quickSuggestions: {
                other: true,
                comments: false,
                strings: false,
            },
            // Smooth cursor
            cursorSmoothCaretAnimation: "on",
        })


        // Dispose previous tab command if exists
        if (tabCommandRef.current) {
            tabCommandRef.current.dispose()
        }

        // Register custom Tab key handler with proper context to override Monaco's built-in handling
        tabCommandRef.current = editor.addCommand(
            monaco.KeyCode.Tab,
            () => {
                // Prevent default tab behavior during suggestion acceptance
                if (isAcceptingSuggestionRef.current) {
                    return
                }

                // Use default tab behavior if suggestion was just accepted
                if (suggestionAcceptedRef.current) {
                    editor.trigger("keyboard", "tab", null)
                    return
                }

                // Accept current suggestion if available
                if (currentSuggestionRef.current) {
                    const accepted = acceptCurrentSuggestion()
                    if (accepted) {
                        // Prevent default tab behavior after accepting suggestion
                        return
                    }
                }

                // Default tab behavior (indentation)
                editor.trigger("keyboard", "tab", null)
            },
            // Context string to properly override Monaco's built-in Tab handling
            "editorTextFocus && !editorReadonly && !suggestWidgetVisible"
        )



        editor.addCommand(monaco.KeyCode.Escape, () => {
            if (currentSuggestionRef.current) {
                onRejectSuggestion(editor)
                clearCurrentSuggestion()
            }

        })

        editor.onDidChangeCursorPosition(() => {
            if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current)

            if (!isAcceptingSuggestionRef.current && !suggestionLoading && !currentSuggestionRef.current) {
                suggestionTimeoutRef.current = setTimeout(() => {
                    onTriggerSuggestion("completion", editor)
                }, 500)
            }
        })

        editor.onDidChangeModelContent((e: any) => {
            if (isAcceptingSuggestionRef.current) return
            if (currentSuggestionRef.current && !suggestionAcceptedRef.current && e.changes.length > 0
            ) {
                const change = e.changes[0]
                if (
                    change.text === currentSuggestionRef.current.text ||
                    change.text === currentSuggestionRef.current.text.replace(/\r/g, "")
                ) {
                    return
                }
                clearCurrentSuggestion()
            }


            const triggers = ["/n", "{", "}", "=", "(", ",", ":", ";"]
            if (e.changes.length > 0 && triggers.includes(e.changes[0].text)) {
                setTimeout(() => {
                    if (editorRef.current && !currentSuggestionRef.current && !suggestionLoading)
                        onTriggerSuggestion("completion", editor)
                }, 500)
            }

        })
        updateEditorLanguage()


        // Keyboard shortcuts
        // editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
        //     console.log("Ctrl+Space pressed, triggering suggestion")
        //     onTriggerSuggestion("completion", editor)
        // })

        // // CRITICAL: Override Tab key with high priority and prevent default Monaco behavior
        // if (tabCommandRef.current) {
        //     tabCommandRef.current.dispose()
        // }

        // tabCommandRef.current = editor.addCommand(
        //     monaco.KeyCode.Tab,
        //     () => {
        //         console.log("TAB PRESSED", {
        //             hasSuggestion: !!currentSuggestionRef.current,
        //             hasActiveSuggestion: hasActiveSuggestionAtPosition(),
        //             isAccepting: isAcceptingSuggestionRef.current,
        //             suggestionAccepted: suggestionAcceptedRef.current,
        //         })

        //         // CRITICAL: Block if already processing
        //         if (isAcceptingSuggestionRef.current) {
        //             console.log("BLOCKED: Already in the process of accepting, ignoring Tab")
        //             return
        //         }

        //         // CRITICAL: Block if just accepted
        //         if (suggestionAcceptedRef.current) {
        //             console.log("BLOCKED: Suggestion was just accepted, using default tab")
        //             editor.trigger("keyboard", "tab", null)
        //             return
        //         }

        //         // If we have an active suggestion at the current position, try to accept it
        //         if (currentSuggestionRef.current && hasActiveSuggestionAtPosition()) {
        //             console.log("ATTEMPTING to accept suggestion with Tab")
        //             const accepted = acceptCurrentSuggestion()
        //             if (accepted) {
        //                 console.log("SUCCESS: Suggestion accepted via Tab, preventing default behavior")
        //                 return // CRITICAL: Return here to prevent default tab behavior
        //             }
        //             console.log("FAILED: Suggestion acceptance failed, falling through to default")
        //         }

        //         // Default tab behavior (indentation)
        //         console.log("DEFAULT: Using default tab behavior")
        //         editor.trigger("keyboard", "tab", null)
        //     },
        //     // CRITICAL: Use specific context to override Monaco's built-in Tab handling
        //     "editorTextFocus && !editorReadonly && !suggestWidgetVisible",
        // )

        // // Escape to reject
        // editor.addCommand(monaco.KeyCode.Escape, () => {
        //     console.log("Escape pressed")
        //     if (currentSuggestionRef.current) {
        //         onRejectSuggestion(editor)
        //         clearCurrentSuggestion()
        //     }
        // })

        // // Listen for cursor position changes to hide suggestions when moving away
        // editor.onDidChangeCursorPosition((e: any) => {
        //     if (isAcceptingSuggestionRef.current) return

        //     const newPosition = e.position

        //     // Clear existing suggestion if cursor moved away
        //     if (currentSuggestionRef.current && !suggestionAcceptedRef.current) {
        //         const suggestionPos = currentSuggestionRef.current.position

        //         // If cursor moved away from suggestion position, clear it
        //         if (
        //             newPosition.lineNumber !== suggestionPos.line ||
        //             newPosition.column < suggestionPos.column ||
        //             newPosition.column > suggestionPos.column + 10
        //         ) {
        //             console.log("Cursor moved away from suggestion, clearing")
        //             clearCurrentSuggestion()
        //             onRejectSuggestion(editor)
        //         }
        //     }

        //     // Trigger new suggestion if appropriate (simplified)
        //     if (!currentSuggestionRef.current && !suggestionLoading) {
        //         // Clear any existing timeout
        //         if (suggestionTimeoutRef.current) {
        //             clearTimeout(suggestionTimeoutRef.current)
        //         }

        //         // Trigger suggestion with a delay
        //         suggestionTimeoutRef.current = setTimeout(() => {
        //             onTriggerSuggestion("completion", editor)
        //         }, 300)
        //     }
        // })

        // // Listen for content changes to detect manual typing over suggestions
        // editor.onDidChangeModelContent((e: any) => {
        //     if (isAcceptingSuggestionRef.current) return

        //     // If user types while there's a suggestion, clear it (unless it's our insertion)
        //     if (currentSuggestionRef.current && e.changes.length > 0 && !suggestionAcceptedRef.current) {
        //         const change = e.changes[0]

        //         // Check if this is our own suggestion insertion
        //         if (
        //             change.text === currentSuggestionRef.current.text ||
        //             change.text === currentSuggestionRef.current.text.replace(/\r/g, "")
        //         ) {
        //             console.log("Our suggestion was inserted, not clearing")
        //             return
        //         }

        //         // User typed something else, clear the suggestion
        //         console.log("User typed while suggestion active, clearing")
        //         clearCurrentSuggestion()
        //     }

        //     // Trigger context-aware suggestions on certain typing patterns
        //     if (e.changes.length > 0 && !suggestionAcceptedRef.current) {
        //         const change = e.changes[0]

        //         // Trigger suggestions after specific characters
        //         if (
        //             change.text === "\n" || // New line
        //             change.text === "{" || // Opening brace
        //             change.text === "." || // Dot notation
        //             change.text === "=" || // Assignment
        //             change.text === "(" || // Function call
        //             change.text === "," || // Parameter separator
        //             change.text === ":" || // Object property
        //             change.text === ";" // Statement end
        //         ) {
        //             setTimeout(() => {
        //                 if (editorRef.current && !currentSuggestionRef.current && !suggestionLoading) {
        //                     onTriggerSuggestion("completion", editor)
        //                 }
        //             }, 100) // Small delay to let the change settle
        //         }
        //     }
        // })

        // updateEditorLanguage()
    }

    const updateEditorLanguage = () => {
        if (!activeFile || !monacoRef.current || !editorRef.current) return
        const model = editorRef.current.getModel()
        if (!model) return

        const language = getEditorLanguage(activeFile.fileExtension || "")
        try {
            monacoRef.current.editor.setModelLanguage(model, language)
        } catch (error) {
            console.warn("Failed to set editor language:", error)
        }
    }

    useEffect(() => {
        updateEditorLanguage()
    }, [activeFile])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (suggestionTimeoutRef.current) {
                clearTimeout(suggestionTimeoutRef.current)
            }
            if (inlineCompletionProviderRef.current) {
                inlineCompletionProviderRef.current.dispose()
                inlineCompletionProviderRef.current = null
            }
            if (tabCommandRef.current) {
                tabCommandRef.current.dispose()
                tabCommandRef.current = null
            }
        }
    }, [])

    return (
        <div className="h-full relative">
            {/* Loading indicator */}
            {suggestionLoading && (
                <div className="absolute top-2 right-2 z-10 bg-red-100 dark:bg-red-900 px-2 py-1 rounded text-xs text-red-700 dark:text-red-300 flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    AI thinking...
                </div>
            )}

            {/* Active suggestion indicator */}
            {currentSuggestionRef.current && !suggestionLoading && (
                <div className="absolute top-2 right-2 z-10 bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-xs text-green-700 dark:text-green-300 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Press Tab to accept
                </div>
            )}

            <Editor
                height="100%"
                value={content}
                onChange={(value) => onContentChange(value || "")}
                onMount={handleEditorDidMount}
                language={activeFile ? getEditorLanguage(activeFile.fileExtension || "") : "plaintext"}
                options={{
                    ...defaultEditorOptions,
                    inlineSuggest: { enabled: true },
                    suggest: {
                        preview: false,
                        showInlineDetails: false,
                        insertMode: "replace",
                    },
                    quickSuggestions: {
                        other: true,
                        comments: false,
                        strings: false,
                    },
                    cursorSmoothCaretAnimation: "on",
                }}
            />
        </div>
    )
}