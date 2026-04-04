const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const CATEGORY = {
  AGENTS: 'agents',
  SKILLS: 'skills',
  WORKFLOWS: 'workflows'
};

class CategoryItem extends vscode.TreeItem {
  constructor(label, category) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.category = category;
    this.contextValue = 'category';
  }
}

class AntigravityItem extends vscode.TreeItem {
  constructor(label, category, filePath, invokeText) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.category = category;
    this.filePath = filePath;
    this.invokeText = invokeText;
    this.command = {
      command: 'antigravity.runItem',
      title: 'Run Antigravity Item',
      arguments: [this]
    };
  }
}

class AntigravityProvider {
  constructor() {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element) {
    return element;
  }

  getChildren(element) {
    const workspaceRoot = getWorkspaceRoot();
    if (!workspaceRoot) {
      return [new vscode.TreeItem('Open a workspace to view Antigravity items.')];
    }

    const antigravityRoot = path.join(workspaceRoot, '.agent', 'antigravity');
    if (!fs.existsSync(antigravityRoot)) {
      return [new vscode.TreeItem('Antigravity folder not found in .agent/.')];
    }

    if (!element) {
      return [
        new CategoryItem('Agents', CATEGORY.AGENTS),
        new CategoryItem('Skills', CATEGORY.SKILLS),
        new CategoryItem('Workflows', CATEGORY.WORKFLOWS)
      ];
    }

    if (element.category === CATEGORY.AGENTS) {
      return listAgents(antigravityRoot);
    }

    if (element.category === CATEGORY.SKILLS) {
      return listSkills(antigravityRoot);
    }

    if (element.category === CATEGORY.WORKFLOWS) {
      return listWorkflows(antigravityRoot);
    }

    return [];
  }
}

function getWorkspaceRoot() {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) return null;
  return folders[0].uri.fsPath;
}

function listAgents(root) {
  const agentsDir = path.join(root, 'agents');
  if (!fs.existsSync(agentsDir)) return [];

  return fs.readdirSync(agentsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const filePath = path.join(agentsDir, entry.name, 'AGENT.md');
      if (!fs.existsSync(filePath)) return null;
      return new AntigravityItem(entry.name, CATEGORY.AGENTS, filePath, `@${entry.name}`);
    })
    .filter(Boolean)
    .sort((a, b) => a.label.localeCompare(b.label));
}

function listSkills(root) {
  const skillsDir = path.join(root, 'skills');
  if (!fs.existsSync(skillsDir)) return [];

  return fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const filePath = path.join(skillsDir, entry.name, 'SKILL.md');
      if (!fs.existsSync(filePath)) return null;
      return new AntigravityItem(entry.name, CATEGORY.SKILLS, filePath, `$${entry.name}`);
    })
    .filter(Boolean)
    .sort((a, b) => a.label.localeCompare(b.label));
}

function listWorkflows(root) {
  const workflowsDir = path.join(root, 'workflows');
  if (!fs.existsSync(workflowsDir)) return [];

  return fs.readdirSync(workflowsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .filter((entry) => entry.name.endsWith('.md'))
    .filter((entry) => entry.name.toLowerCase() !== 'readme.md')
    .map((entry) => {
      const baseName = entry.name.replace(/\.md$/, '');
      const filePath = path.join(workflowsDir, entry.name);
      return new AntigravityItem(baseName, CATEGORY.WORKFLOWS, filePath, `/${baseName}`);
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

function findWorkflowScript(workspaceRoot, workflowName) {
  const scriptsDir = path.join(workspaceRoot, 'scripts');
  if (!fs.existsSync(scriptsDir)) return null;

  const candidates = [
    path.join(scriptsDir, `${workflowName}.sh`),
    path.join(scriptsDir, `${workflowName}.py`)
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

function scriptCommand(scriptPath) {
  if (scriptPath.endsWith('.sh')) {
    return `bash "${scriptPath}"`;
  }
  if (scriptPath.endsWith('.py')) {
    return `python3 "${scriptPath}"`;
  }
  return `"${scriptPath}"`;
}

function getTerminal() {
  return vscode.window.terminals.find((t) => t.name === 'Antigravity')
    || vscode.window.createTerminal('Antigravity');
}

async function runItem(item) {
  if (!item) return;
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) return;

  const terminal = getTerminal();

  if (item.category === CATEGORY.WORKFLOWS) {
    const scriptPath = findWorkflowScript(workspaceRoot, item.label);
    if (scriptPath) {
      terminal.show(true);
      terminal.sendText(scriptCommand(scriptPath), true);
      return;
    }
  }

  if (item.filePath && fs.existsSync(item.filePath)) {
    const doc = await vscode.workspace.openTextDocument(item.filePath);
    await vscode.window.showTextDocument(doc, { preview: false });
  }

  if (item.invokeText) {
    await vscode.env.clipboard.writeText(item.invokeText);
    vscode.window.showInformationMessage(`Copied ${item.invokeText} to clipboard.`);
  }
}

function activate(context) {
  const provider = new AntigravityProvider();

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('antigravityView', provider),
    vscode.commands.registerCommand('antigravity.refresh', () => provider.refresh()),
    vscode.commands.registerCommand('antigravity.runItem', (item) => runItem(item))
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
