import JSZip from 'jszip';
import { FileItem, SearchResult } from '../types';
import { getLanguageFromPath } from './fileIcons';

export function findFileByPath(files: FileItem[], path: string): FileItem | null {
  for (const item of files) {
    if (item.path === path) return item;
    if (item.children) {
      const found = findFileByPath(item.children, path);
      if (found) return found;
    }
  }
  return null;
}

export function updateFileInTree(
  files: FileItem[],
  path: string,
  updater: (item: FileItem) => FileItem
): FileItem[] {
  return files.map((item) => {
    if (item.path === path) {
      return updater({ ...item });
    }
    if (item.children) {
      return {
        ...item,
        children: updateFileInTree(item.children, path, updater),
      };
    }
    return item;
  });
}

export function addFileToTree(
  files: FileItem[],
  parentPath: string | null,
  newItemName: string,
  type: 'file' | 'folder'
): { newTree: FileItem[]; createdItem: FileItem } {
  const fullPath = parentPath ? `${parentPath}/${newItemName}` : newItemName;
  const createdItem: FileItem = {
    id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: newItemName,
    path: fullPath,
    type,
    language: type === 'file' ? getLanguageFromPath(newItemName) : undefined,
    content: type === 'file' ? '' : undefined,
    originalContent: undefined, // newly created file
    isLoaded: true,
    isModified: true,
    isOpen: false,
    children: type === 'folder' ? [] : undefined,
  };

  if (!parentPath) {
    return {
      newTree: [...files, createdItem],
      createdItem,
    };
  }

  function insertRecursively(items: FileItem[]): FileItem[] {
    return items.map((item) => {
      if (item.path === parentPath && item.type === 'folder') {
        const children = item.children ? [...item.children, createdItem] : [createdItem];
        return { ...item, isOpen: true, children };
      }
      if (item.children) {
        return { ...item, children: insertRecursively(item.children) };
      }
      return item;
    });
  }

  return {
    newTree: insertRecursively(files),
    createdItem,
  };
}

export function deleteFileFromTree(files: FileItem[], targetPath: string): FileItem[] {
  return files
    .filter((item) => item.path !== targetPath)
    .map((item) => {
      if (item.children) {
        return {
          ...item,
          children: deleteFileFromTree(item.children, targetPath),
        };
      }
      return item;
    });
}

export function renameItemInTree(
  files: FileItem[],
  oldPath: string,
  newName: string
): { newTree: FileItem[]; newPath: string } {
  const parts = oldPath.split('/');
  parts[parts.length - 1] = newName;
  const newPath = parts.join('/');

  function updatePathRecursively(items: FileItem[]): FileItem[] {
    return items.map((item) => {
      if (item.path === oldPath) {
        const isFile = item.type === 'file';
        return {
          ...item,
          name: newName,
          path: newPath,
          language: isFile ? getLanguageFromPath(newName) : item.language,
          isModified: true,
        };
      }
      if (item.path.startsWith(oldPath + '/')) {
        const subPath = item.path.replace(oldPath, newPath);
        return {
          ...item,
          path: subPath,
          children: item.children ? updatePathRecursively(item.children) : undefined,
        };
      }
      if (item.children) {
        return { ...item, children: updatePathRecursively(item.children) };
      }
      return item;
    });
  }

  return { newTree: updatePathRecursively(files), newPath };
}

export function searchFilesInTree(
  files: FileItem[],
  query: string,
  caseSensitive = false,
  matchWholeWord = false
): SearchResult[] {
  if (!query.trim()) return [];
  const results: SearchResult[] = [];

  function walk(item: FileItem) {
    if (item.type === 'file' && item.content) {
      const lines = item.content.split('\n');
      const fileMatches: SearchResult['matches'] = [];

      lines.forEach((line, index) => {
        let regex: RegExp;
        try {
          const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const pattern = matchWholeWord ? `\\b${escaped}\\b` : escaped;
          regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
        } catch {
          return;
        }

        let match: RegExpExecArray | null;
        while ((match = regex.exec(line)) !== null) {
          fileMatches.push({
            lineNumber: index + 1,
            lineContent: line.trim(),
            matchIndex: match.index,
            matchLength: match[0].length,
          });
          if (!regex.global) break;
        }
      });

      if (fileMatches.length > 0) {
        results.push({ file: item, matches: fileMatches });
      }
    }

    if (item.children) {
      item.children.forEach(walk);
    }
  }

  files.forEach(walk);
  return results;
}

export function getAllFilesFlat(files: FileItem[]): FileItem[] {
  const result: FileItem[] = [];
  function walk(items: FileItem[]) {
    for (const item of items) {
      result.push(item);
      if (item.children) {
        walk(item.children);
      }
    }
  }
  walk(files);
  return result;
}

export async function exportWorkspaceAsZip(files: FileItem[], repoName: string): Promise<void> {
  const zip = new JSZip();

  function addToZip(item: FileItem) {
    if (item.type === 'file') {
      zip.file(item.path, item.content ?? '');
    }
    if (item.children) {
      item.children.forEach(addToZip);
    }
  }

  files.forEach(addToZip);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${repoName || 'workspace'}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
