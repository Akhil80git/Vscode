import { FileItem } from '../types';
import { getLanguageFromPath } from './fileIcons';

export interface GitHubRepoInfo {
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  description: string;
  stars: number;
  forks: number;
  isPrivate: boolean;
}

export function parseGitHubUrl(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim().replace(/\.git$/, '');
  
  // Format: owner/repo
  const shorthandMatch = trimmed.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (shorthandMatch) {
    return { owner: shorthandMatch[1], repo: shorthandMatch[2] };
  }

  // Format: https://github.com/owner/repo or git@github.com:owner/repo
  const urlMatch = trimmed.match(/(?:github\.com[/|:])([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/i);
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2] };
  }

  return null;
}

export async function fetchRepoMetadata(
  owner: string,
  repo: string,
  token?: string
): Promise<GitHubRepoInfo> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Repository "${owner}/${repo}" not found or is private. If it's private, provide a GitHub Personal Access Token.`);
    }
    if (res.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Please add a Personal Access Token in Settings to get 5,000 reqs/hr.');
    }
    throw new Error(`Failed to fetch repo info: ${res.statusText}`);
  }

  const data = await res.json();
  return {
    owner: data.owner.login,
    name: data.name,
    fullName: data.full_name,
    defaultBranch: data.default_branch || 'main',
    description: data.description || '',
    stars: data.stargazers_count || 0,
    forks: data.forks_count || 0,
    isPrivate: data.private || false,
  };
}

export async function fetchRepoBranches(
  owner: string,
  repo: string,
  token?: string
): Promise<string[]> {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`, { headers });
    if (!res.ok) return ['main'];
    const data = await res.json();
    return Array.isArray(data) ? data.map((b: { name: string }) => b.name) : ['main'];
  } catch {
    return ['main'];
  }
}

export async function cloneGitHubRepository(
  owner: string,
  repo: string,
  branch: string,
  token?: string,
  onProgress?: (status: string) => void
): Promise<{ files: FileItem[]; defaultBranch: string; branches: string[] }> {
  onProgress?.('Fetching repository metadata...');
  const meta = await fetchRepoMetadata(owner, repo, token);
  const targetBranch = branch || meta.defaultBranch;

  onProgress?.(`Fetching branches for ${owner}/${repo}...`);
  const branches = await fetchRepoBranches(owner, repo, token);

  onProgress?.(`Downloading file tree for branch "${targetBranch}"...`);
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${targetBranch}?recursive=1`,
    { headers }
  );

  if (!treeRes.ok) {
    throw new Error(`Failed to download tree for branch ${targetBranch}. Status: ${treeRes.statusText}`);
  }

  const treeData = await treeRes.json();
  if (!treeData.tree || !Array.isArray(treeData.tree)) {
    throw new Error('Invalid file tree received from GitHub.');
  }

  onProgress?.(`Processing ${treeData.tree.length} files & directories...`);

  // Build hierarchical structure
  const rootItems: FileItem[] = [];
  const mapByPath = new Map<string, FileItem>();

  // Filter out git internals or oversized folders if any, but keep code
  const items = treeData.tree.filter((node: { path: string }) => !node.path.startsWith('.git/'));

  // Sort paths so folders appear first and parent folders exist
  items.sort((a: { path: string }, b: { path: string }) => a.path.localeCompare(b.path));

  for (const node of items) {
    const isTree = node.type === 'tree';
    const parts = node.path.split('/');
    const name = parts[parts.length - 1];
    const parentPath = parts.slice(0, -1).join('/');

    const fileItem: FileItem = {
      id: `${node.path}-${Math.random().toString(36).substring(2, 7)}`,
      name,
      path: node.path,
      type: isTree ? 'folder' : 'file',
      language: isTree ? undefined : getLanguageFromPath(node.path),
      sha: node.sha,
      size: node.size,
      downloadUrl: node.url,
      children: isTree ? [] : undefined,
      isLoaded: false,
      isOpen: false,
      isModified: false,
    };

    mapByPath.set(node.path, fileItem);

    if (parentPath === '') {
      rootItems.push(fileItem);
    } else {
      const parent = mapByPath.get(parentPath);
      if (parent && parent.children) {
        parent.children.push(fileItem);
      } else {
        rootItems.push(fileItem);
      }
    }
  }

  // Pre-fetch the README.md or package.json or main file if exists so user sees immediate content!
  const readme = items.find((n: { path: string }) => n.path.toLowerCase() === 'readme.md');
  const fileToPrefetch = readme || items.find((n: { type: string }) => n.type === 'blob');

  if (fileToPrefetch) {
    try {
      onProgress?.(`Prefetching ${fileToPrefetch.path}...`);
      const item = mapByPath.get(fileToPrefetch.path);
      if (item) {
        const content = await fetchFileContent(owner, repo, targetBranch, fileToPrefetch.path, token);
        item.content = content;
        item.originalContent = content;
        item.isLoaded = true;
      }
    } catch (e) {
      console.warn('Could not prefetch initial file', e);
    }
  }

  onProgress?.('Repository clone complete!');
  return {
    files: rootItems,
    defaultBranch: targetBranch,
    branches: branches.length ? branches : [targetBranch],
  };
}

export async function fetchFileContent(
  owner: string,
  repo: string,
  branch: string,
  filePath: string,
  token?: string
): Promise<string> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  // First try raw.githubusercontent.com for fast full text
  try {
    const rawRes = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`,
      { headers }
    );
    if (rawRes.ok) {
      return await rawRes.text();
    }
  } catch {
    // Fallback to GitHub API
  }

  // Fallback to GitHub API
  const apiRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
    {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        ...headers,
      },
    }
  );

  if (!apiRes.ok) {
    throw new Error(`Failed to load file content (${apiRes.statusText})`);
  }

  const data = await apiRes.json();
  if (data.content && data.encoding === 'base64') {
    // UTF-8 safe base64 decode
    const binary = atob(data.content.replace(/\s/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  }

  return '';
}

export const POPULAR_GITHUB_REPOS = [
  {
    name: 'shadcn-ui/ui',
    desc: 'Beautifully designed components that you can copy and paste into your apps.',
    stars: '75k',
    lang: 'TypeScript',
  },
  {
    name: 'facebook/react',
    desc: 'The library for web and native user interfaces.',
    stars: '230k',
    lang: 'JavaScript',
  },
  {
    name: 'expressjs/express',
    desc: 'Fast, unopinionated, minimalist web framework for Node.js.',
    stars: '65k',
    lang: 'JavaScript',
  },
  {
    name: 'octocat/Hello-World',
    desc: 'Simple starter repository for GitHub testing and beginners.',
    stars: '2.5k',
    lang: 'Markdown',
  },
  {
    name: 'vitejs/vite',
    desc: 'Next Generation Frontend Tooling. It\'s fast!',
    stars: '72k',
    lang: 'TypeScript',
  },
  {
    name: 'tailwindlabs/tailwindcss',
    desc: 'A utility-first CSS framework for rapid UI development.',
    stars: '84k',
    lang: 'CSS',
  },
];
