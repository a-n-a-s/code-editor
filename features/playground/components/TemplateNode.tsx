import React, { useState } from "react";
import {
  ChevronRight,
  File,
  Folder,
  Plus,
  FilePlus,
  FolderPlus,
  MoreHorizontal,
  Trash2,
  Edit3,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarRail,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TemplateFile } from "../lib/path-to-json";
import {
  DeleteDialog,
  NewFileDialog,
  NewFolderDialog,
  RenameFileDialog,
} from "./TemplateFileTree";
import { file } from "zod";

interface FileItem {
  filename: string;
  fileExtension?: string;
  content: string;
  type: "file";
}

interface FolderItem {
  folderName: string;
  items: (FileItem | FolderItem)[];
  type: "folder";
}

type FileSystemItem = FileItem | FolderItem;

interface FileTreeProps {
  data: FileSystemItem;
  onFileSelect: (file: FileItem) => void;
  selectedFile?: FileItem;
}

interface TemplateNodeProps {
  item: FileSystemItem;
  onFileSelect: (file: FileItem) => void;
  selectedFile?: FileItem;
  level: number;
  path?: string;
  onAddFile?: (file: FileItem, parentPath: string) => void;
  onAddFolder?: (folder: FolderItem, parentPath: string) => void;
  onDelete?: (file: FileSystemItem, parentPath: string) => void;
  onDeleteFolder?: (folder: FolderItem, parentPath: string) => void;
  onRenameFile?: (
    file: FileItem,
    newName: string,
    newExtension: string,
    parentPath: string
  ) => void;
  onRenameFolder?: (
    folder: FolderItem,
    newName: string,
    parentPath: string
  ) => void;
}

const TemplateNode = ({
  item,
  onFileSelect,
  selectedFile,
  level,
  path,
  onAddFile,
  onAddFolder,
  onDelete,
  onDeleteFolder,
  onRenameFile,
  onRenameFolder,
}: TemplateNodeProps) => {
  const isValidItem = item && typeof item === "object";
  const isFolder = isValidItem && "folderName" in item;

  const [isOpen, setIsOpen] = useState(level < 2);

  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (!isValidItem) return null;
  if (!isFolder) {
    const file = item as FileItem;
    const fileName = `${file.filename}.${file.fileExtension}`;

    const isSelected =
      selectedFile &&
      selectedFile.filename === file.filename &&
      selectedFile.fileExtension === file.fileExtension;

    const handleRename = () => {
      setIsRenameDialogOpen(true);
    };
    const handleDelete = () => {
      setIsDeleteDialogOpen(true);
    };
    const confirmDelete = () => {
      onDelete?.(file, path);

      setIsDeleteDialogOpen(false);
    };

    const handleRenameConfirm = (newName: string, newExtension: string) => {
      onRenameFile?.(file, newName, newExtension, path);
      setIsRenameDialogOpen(false);
    };

    return (
      <SidebarMenuItem>
        <div className="flex items-center group">
          <SidebarMenuButton className="flex-1" isActive={isSelected} onClick={() => onFileSelect?.(file)} >

            <File className="h-4 w-4 mr-2 shrink-0" />
            <span>{fileName}</span>
          </SidebarMenuButton>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={"ghost"}
                size={"icon"}
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
              >
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleRename}>
                <Edit3 className="w-3 h-3 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="w-3 h-3 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <RenameFileDialog
          isOpen={isRenameDialogOpen}
          onClose={() => setIsRenameDialogOpen(false)}
          onRename={handleRenameConfirm}
        />
        <DeleteDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
        />
      </SidebarMenuItem>
    );
  } else {
    const folder = item as FolderItem;
    const folderName = folder.folderName;
    const currentPath = path ? `${path}/${folderName}` : folderName;

    const handleAddFile = () => {
      setIsNewFileDialogOpen(true);
    };
    const handleAddFolder = () => {
      setIsNewFolderDialogOpen(true);
    };
    const handleDeleteFolder = () => {
      setIsDeleteDialogOpen(true);
    };

    const handleRenameFolder = () => {
      setIsRenameDialogOpen(true);
    };

    const confirmDeleteFolder = () => {
      onDeleteFolder?.(folder, path);
      setIsDeleteDialogOpen(false);
    };

    const handleCreateFile = (filename: string, extension: string) => {
      if (onAddFile) {
        const newFile: TemplateFile = {
          filename: filename,
          fileExtension: extension,
          content: "",
          type: "file",
        };
        onAddFile(newFile, currentPath);
      }
      setIsNewFileDialogOpen(false);
    };

    const handleCreateFolder = (folderName: string) => {
      if (onAddFolder) {
        const newFolder: FolderItem = {
          folderName: folderName,
          items: [],
        };
        onAddFolder(newFolder, currentPath);
      }
      setIsNewFolderDialogOpen(false);
    };

    const handleRenameSubmit = (newName: string) => {
      onRenameFolder?.(folder, newName, path);
      setIsRenameDialogOpen(false);
    };

    return (
      <SidebarMenuItem>
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="group/collapsible  [&[data-state=open]>div>button>svg:first-child]:rotate-90"
        >
          <div className="flex items-center group">
            <CollapsibleTrigger asChild>
              <SidebarMenuButton className="flex-1">
                <ChevronRight className="transition-transform" />
                <Folder className="h-4 w-4 mr-2 shrink-0" />
                <span>{folderName}</span>
              </SidebarMenuButton>
            </CollapsibleTrigger>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={"ghost"}
                  size={"icon"}
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleAddFile}>
                  <FilePlus className="w-4 h-4 mr-2" />
                  New File
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleAddFolder}>
                  <FolderPlus className="w-4 h-4 mr-2" />
                  New Folder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleRenameFolder}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleDeleteFolder}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CollapsibleContent>
            <SidebarMenuSub>
              {folder?.items.map((childItem, index) => (
                <TemplateNode
                  key={index}
                  item={childItem}
                  onFileSelect={onFileSelect}
                  selectedFile={selectedFile}
                  level={level + 1}
                  path={currentPath}
                  onAddFile={onAddFile}
                  onAddFolder={onAddFolder}
                  onDelete={onDelete}
                  onDeleteFolder={onDeleteFolder}
                  onRenameFile={onRenameFile}
                  onRenameFolder={onRenameFolder}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>

        <NewFileDialog
          isOpen={isNewFileDialogOpen}
          onClose={() => setIsNewFileDialogOpen(false)}
          onCreateFile={handleCreateFile}
        />

        <NewFolderDialog
          isOpen={isNewFolderDialogOpen}
          onClose={() => setIsNewFolderDialogOpen(false)}
          onCreateFolder={handleCreateFolder}
        />

        <RenameFileDialog
          isOpen={isRenameDialogOpen}
          onClose={() => setIsRenameDialogOpen(false)}
          onSubmit={handleRenameSubmit}
          currentFilename={file.filename}
          currentFileExtension={file.fileExtension}

        />

        <DeleteDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={confirmDeleteFolder}
        />
      </SidebarMenuItem>
    );
  }
};

export default TemplateNode;
