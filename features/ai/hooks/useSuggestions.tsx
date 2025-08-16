import { useState, useCallback, useRef } from "react";

interface AISuggestionState {
  suggestion: string | null;
  isLoading: boolean;
  position: { line: number; column: number } | null;
  decoration: string[];
  isEnabled: boolean;
}

interface UseAISuggestionsReturn extends AISuggestionState {
  toggleEnabled: () => void;
  fetchSuggestion: (type: string, editor: any) => Promise<void>;
  acceptSuggestion: (editor: any, monaco: any) => void;
  rejectSuggestion: (editor: any) => void;
  clearSuggestion: (editor: any) => void;
}

export const useAiSuggestions = (): UseAISuggestionsReturn => {
  const [state, setState] = useState<AISuggestionState>({
    suggestion: null,
    isLoading: false,
    position: null,
    decoration: [],
    isEnabled: true, // Enable by default for better UX
  });

  // Use a ref to access the current state in callbacks
  const stateRef = useRef(state);
  stateRef.current = state;

  const toggleEnabled = useCallback(() => {
    setState(prev => ({
      ...prev,
      isEnabled: !prev.isEnabled,
    }));
  }, []);

  const fetchSuggestion = useCallback(async (type: string, editor: any) => {
    console.log("Fetching AI suggestion...");
    console.log("AI Suggestions Enabled:", stateRef.current.isEnabled);
    console.log("Editor Instance Available:", !!editor);

    // Check if AI suggestions are enabled
    if (!stateRef.current.isEnabled) {
      console.warn("AI suggestions are disabled.");
      return;
    }

    if (!editor) {
      console.warn("Editor instance is not available.");
      return;
    }

    const model = editor.getModel();
    const cursorPosition = editor.getPosition();

    if (!model || !cursorPosition) {
      console.warn("Editor model or cursor position is not available.");
      return;
    }

    // Set loading state
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const payload = {
        fileContent: model.getValue(),
        cursorLine: cursorPosition.lineNumber - 1,
        cursorColumn: cursorPosition.column - 1,
        suggestionType: type,
      };
      console.log("Request payload:", payload);

      const response = await fetch("/api/code-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(data);
      
      if (data.suggestion) {
        const suggestionText = data.suggestion.trim();
        setState(prev => ({
          ...prev,
          suggestion: suggestionText,
          position: {
            line: cursorPosition.lineNumber,
            column: cursorPosition.column,
          },
          isLoading: false,
        }));
      } else {
        console.warn("No suggestion received from API.");
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error("Error fetching code suggestion:", error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const acceptSuggestion = useCallback((editor: any, monaco: any) => {
    setState(prev => {
      if (
        !prev.suggestion ||
        !prev.position ||
        !editor ||
        !monaco
      ) {
        return prev;
      }

      const { line, column } = prev.position;

      const sanitizeSegment = prev.suggestion.replace(
        /^\d+:\s*/gm,
        ""
      );

      editor.executeEdits("", [
        {
          range: new monaco.Range(line, column, line, column),
          text: sanitizeSegment,
          forceMoveMarkers: true,
        },
      ]);

      if (editor && prev.decoration.length > 0) {
        editor.deltaDecorations(prev.decoration, []);
      }
      
      return {
        ...prev,
        suggestion: null,
        position: null,
        decoration: [],
      };
    });
  }, []);

  const rejectSuggestion = useCallback((editor: any) => {
    setState(prev => {
      if (editor && prev.decoration.length > 0) {
        editor.deltaDecorations(prev.decoration, []);
      }
      return {
        ...prev,
        suggestion: null,
        position: null,
        decoration: [],
      };
    });
  }, []);
  
  const clearSuggestion = useCallback((editor: any) => {
    setState(prev => {
      if (editor && prev.decoration.length > 0) {
        editor.deltaDecorations(prev.decoration, []);
      }
      return {
        ...prev,
        suggestion: null,
        position: null,
        decoration: [],
      };
    });
  }, []);
  
  return {
    ...state,
    toggleEnabled,
    fetchSuggestion,
    acceptSuggestion,
    rejectSuggestion,
    clearSuggestion,
  };
};
