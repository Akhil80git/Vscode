import { Project, FileItem, TabItem } from '../types';

const STORAGE_PROJECTS_KEY = 'vscode_web_projects_v2';
const STORAGE_ACTIVE_ID_KEY = 'vscode_web_active_project_id_v2';

export const TEMPLATES = {
  blank: (name: string): FileItem[] => [],
  web: (name: string): FileItem[] => [
    {
      id: 'f-index',
      name: 'index.html',
      path: 'index.html',
      type: 'file',
      language: 'html',
      isLoaded: true,
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name}</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>🛍️ ${name}</h1>
      <p class="subtitle">Welcome to your clean project. Start building!</p>
    </header>

    <main class="content">
      <div class="card">
        <h2>Live Preview Ready</h2>
        <p>Edit <span class="code">index.html</span>, <span class="code">style.css</span>, or <span class="code">script.js</span> to see instant live updates.</p>
        <button id="actionBtn" class="btn">Click Me</button>
        <p id="resultText" class="result"></p>
      </div>
    </main>
  </div>
  <script src="script.js"></script>
</body>
</html>
`,
    },
    {
      id: 'f-style',
      name: 'style.css',
      path: 'style.css',
      type: 'file',
      language: 'css',
      isLoaded: true,
      content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0f172a;
  color: #f8fafc;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.container {
  max-width: 600px;
  width: 100%;
}

.header {
  text-align: center;
  margin-bottom: 24px;
}

.header h1 {
  font-size: 2.2rem;
  color: #38bdf8;
  margin-bottom: 8px;
}

.subtitle {
  color: #94a3b8;
  font-size: 1rem;
}

.card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
}

.card h2 {
  font-size: 1.3rem;
  margin-bottom: 12px;
  color: #f1f5f9;
}

.card p {
  color: #94a3b8;
  margin-bottom: 18px;
  line-height: 1.5;
}

.code {
  background: #0f172a;
  color: #38bdf8;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.btn {
  background: #0284c7;
  color: white;
  border: none;
  padding: 10px 24px;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover {
  background: #0369a1;
  transform: translateY(-1px);
}

.result {
  margin-top: 16px;
  font-size: 0.9rem;
  color: #34d399;
  font-weight: 500;
}
`,
    },
    {
      id: 'f-script',
      name: 'script.js',
      path: 'script.js',
      type: 'file',
      language: 'javascript',
      isLoaded: true,
      content: `// Interactive script for ${name}
let clickCount = 0;
const btn = document.getElementById('actionBtn');
const result = document.getElementById('resultText');

if (btn && result) {
  btn.addEventListener('click', () => {
    clickCount++;
    result.textContent = \`🎉 Button clicked \${clickCount} time\${clickCount > 1 ? 's' : ''}! Live preview is working.\`;
  });
}
`,
    },
  ],
};

export function createNewProject(
  name: string,
  templateType: 'blank' | 'web' = 'blank'
): Project {
  const cleanName = name.trim() || 'my-project';
  const id = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const files = templateType === 'web' ? TEMPLATES.web(cleanName) : TEMPLATES.blank(cleanName);

  const openTabs: TabItem[] = files.length > 0
    ? [
        {
          id: files[0].path,
          path: files[0].path,
          name: files[0].name,
          language: files[0].language || 'plaintext',
        },
      ]
    : [];

  const activeTabPath = files.length > 0 ? files[0].path : null;

  return {
    id,
    name: cleanName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    files,
    openTabs,
    activeTabPath,
    gitState: {
      currentBranch: 'main',
      branches: ['main'],
      commits: [
        {
          id: `init-${Date.now()}`,
          hash: Math.random().toString(16).substring(2, 9),
          message: `Created project "${cleanName}"`,
          author: 'user',
          date: 'Just now',
          filesCount: files.length,
        },
      ],
    },
  };
}

export function loadAllProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_PROJECTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load projects from localStorage', err);
  }

  // Initial default clean project (user requested clean start or ecommerce-site)
  const defaultProject = createNewProject('ecommerce-site', 'web');
  saveAllProjects([defaultProject]);
  setActiveProjectId(defaultProject.id);
  return [defaultProject];
}

export function saveAllProjects(projects: Project[]): void {
  try {
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error('Failed to save projects to localStorage', err);
  }
}

export function saveProject(project: Project): void {
  const projects = loadAllProjects();
  const index = projects.findIndex((p) => p.id === project.id);
  const updatedProject = { ...project, updatedAt: new Date().toISOString() };

  if (index >= 0) {
    projects[index] = updatedProject;
  } else {
    projects.push(updatedProject);
  }
  saveAllProjects(projects);
}

export function getActiveProjectId(): string | null {
  try {
    return localStorage.getItem(STORAGE_ACTIVE_ID_KEY);
  } catch {
    return null;
  }
}

export function setActiveProjectId(id: string): void {
  try {
    localStorage.setItem(STORAGE_ACTIVE_ID_KEY, id);
  } catch {
    // ignore
  }
}

export function deleteProjectFromStorage(id: string): Project[] {
  const projects = loadAllProjects().filter((p) => p.id !== id);
  saveAllProjects(projects);
  return projects;
}

export function renameProjectInStorage(id: string, newName: string): Project[] {
  const projects = loadAllProjects().map((p) => {
    if (p.id === id) {
      return { ...p, name: newName.trim() || p.name, updatedAt: new Date().toISOString() };
    }
    return p;
  });
  saveAllProjects(projects);
  return projects;
}
