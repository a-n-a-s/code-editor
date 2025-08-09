"use client"

import React, { useRef, useState, useEffect } from 'react'
import Editor, { type Monaco } from "@monaco-editor/react"

import { configureMonaco, defaultEditorOptions, getEditorLanguage } from '@/features/playground/lib/editor-config'
import { TemplateFile } from '../lib/path-to-json'

interface PlaygroundEditorProps {
    content: string
    activeFile: TemplateFile | undefined
    onContentChange: (content: string) => void

}

const PLaygroundEditor = ({
    content,
    activeFile,
    onContentChange,
}: PlaygroundEditorProps) => {
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<Monaco | null>(null);

    const handleEditorDidMount = (editor: any, monaco: Monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        configureMonaco(monaco)
    };
    const updateEditorLanguage = () => {
        if (!activeFile || !monacoRef.current || !editorRef.current) {
            return;
        }

        const model = editorRef.current.getModel();
        if (!model) {
            return;
        }
        const language = getEditorLanguage(activeFile.fileExtension ||
            ""
        );
        try {
            monacoRef.current.editor.setModelLanguage(model, language);
        } catch (err) {
            console.warn(err)
        }

    }


    useEffect(() => {
        updateEditorLanguage()
    }, [activeFile])

    return (
        <div className='h-full relative'>
            <Editor height={"100%"} value={content} onChange={(value) => onContentChange(value || "")} onMount={handleEditorDidMount} language={activeFile ? getEditorLanguage(activeFile.fileExtension || "") : "plaintext"} options={defaultEditorOptions} />

        </div>
    )
}

export default PLaygroundEditor