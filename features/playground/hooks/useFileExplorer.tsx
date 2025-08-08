import { create } from "zustand";

import { TemplateFile, TemplateFolder } from "../types/type";
import { toast } from "sonner";
import { generateFileId } from "../lib";

interface FileExplorerState {
  playgroundId: string;
  templateData: TemplateFolder | null;
  openFiles: OpenFile[];
  activeFileId: string | null;
  editorContent: string;

  // Actions
  setPlaygroundId: (id: string) => void;
  setTemplateData: (data: TemplateFolder | null) => void;
  setEditorContent: (content: string) => void;
  setOpenFiles: (files: OpenFile[]) => void;
  setActiveFileId: (fileId: string | null) => void;
  openFile: (file: TemplateFile) => void;
  closeFile: (fileId: string) => void;
  closeAllFiles: () => void;
  handleAddFile: (
    newFile: TemplateFile,
    parentPath: string,
    writeFileSync: (filePath: string, content: string) => Promise<void>,
    instance: any,
    saveTemplateData: (data: TemplateFolder) => Promise<void>
  ) => Promise<void>;
  handleAddFolder: (
    newFolder: TemplateFolder,
    parentPath: string,
    instance: any,
    saveTemplateData: (data: TemplateFolder) => Promise<void>
  ) => Promise<void>;
  handleDeleteFile: (
    file: TemplateFile,
    parentPath: string,
    saveTemplateData: (data: TemplateFolder) => Promise<void>
  ) => Promise<void>;
  handleDeleteFolder: (
    folder: TemplateFolder,
    parentPath: string,
    saveTemplateData: (data: TemplateFolder) => Promise<void>
  ) => Promise<void>;
  handleRenameFile: (
    file: TemplateFile,
    newFilename: string,
    newExtension: string,
    parentPath: string,
    saveTemplateData: (data: TemplateFolder) => Promise<void>
  ) => Promise<void>;
  handleRenameFolder: (
    folder: TemplateFolder,
    newFolderName: string,
    parentPath: string,
    saveTemplateData: (data: TemplateFolder) => Promise<void>
  ) => Promise<void>;
  updateFileContent: (fileId: string, content: string) => void;
}

interface OpenFile extends TemplateFile {
  id: string;
  hasUnsavedChanges: boolean;
  content: string;
  originalContent: string;
}
//@ts-ignore
export const useFileExplorer = create<FileExplorerState>((set, get) => ({
  templateData: null,
  playgroundId: "",
  openFiles: [] satisfies OpenFile[],
  activeFileId: null,
  editorContent: "",

  setTemplateData: (data) => set({ templateData: data }),
  setPlaygroundId: (id) => set({ playgroundId: id }),
  setEditorContent: (content) => set({ editorContent: content }),
  setOpenFiles: (files) => set({ openFiles: files }),
  setActiveFileId: (fileId) => set({ activeFileId: fileId }),

  openFile: (file) => {
    const fileId = generateFileId(file, get().templateData!);
    const { openFiles } = get();

    const existingFile = openFiles.find((f) => f.id === fileId);
    if (existingFile) {
      set({ activeFileId: fileId, editorContent: existingFile.content });
    return;
    }
    
    const newOpenFile : OpenFile = {
        ...file,
        id : fileId,
        hasUnsavedChanges : false,
        content : file.content || "",
        originalContent : file.content || "",


    }

    set((state)=>({
        openFiles : [...state.openFiles,newOpenFile],
        activeFileId : fileId,
        editorContent : file.content || "",

    }))

  },
}));
