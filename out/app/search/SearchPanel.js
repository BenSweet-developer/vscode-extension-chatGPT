"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchPanel = void 0;
const vscode = require("vscode");
const environment_1 = require("../../environtments/environment");
const fs_1 = require("fs");
class SearchPanel {
    static createOrShow(extensionUri, extensionPath) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // If we already have a panel, show it.
        if (SearchPanel.currentPanel) {
            SearchPanel.currentPanel._panel.reveal(column);
            return;
        }
        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(SearchPanel.viewType, this.viewType, column || vscode.ViewColumn.One, getWebviewOptions(extensionUri));
        SearchPanel.currentPanel = new SearchPanel(panel, extensionUri, extensionPath);
    }
    static revive(panel, extensionUri, extensionPath) {
        SearchPanel.currentPanel = new SearchPanel(panel, extensionUri, extensionPath);
    }
    constructor(panel, extensionUri, extensionPath) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._extensionPath = extensionPath;
        // Set the webview's initial html content
        this._update();
        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Update the content based on view changes
        this._panel.onDidChangeViewState(e => {
            if (this._panel.visible) {
                this._update();
            }
        }, null, this._disposables);
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'alert':
                    vscode.window.showErrorMessage(message.text);
                    return;
            }
        }, null, this._disposables);
    }
    doRefactor() {
        // Send a message to the webview webview.
        // You can send any JSON serializable data.
        this._panel.webview.postMessage({ command: 'refactor' });
    }
    dispose() {
        SearchPanel.currentPanel = undefined;
        // Clean up our resources
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    _update() {
        this._panel.title = 'ChatGPT 3.5';
        this._panel.webview.html = this._getHtmlForWebview();
    }
    _getHtmlForWebview() {
        // return readFileSync(vscode.Uri.joinPath(this._extensionUri, 'src/app/search/chatgpt-search.html').path).toString().replace('<OPENAI_API_KEY>', environment.OPENAI_API_KEY);
        // Local path to main script run in the webview
        const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'src', 'html', 'chatgpt-search.html');
        // const filePath: vscode.Uri = vscode.Uri.file(path.join(this._extensionPath, 'src', 'html', 'chatgpt-search.html'));
        return (0, fs_1.readFileSync)(scriptPathOnDisk.fsPath, 'utf8').toString().replace('<OPENAI_API_KEY>', environment_1.environment.OPENAI_API_KEY);
    }
}
exports.SearchPanel = SearchPanel;
SearchPanel.viewType = 'chatGPTSearch';
function getWebviewOptions(extensionUri) {
    return {
        // Enable javascript in the webview
        enableScripts: true,
        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
    };
}
//# sourceMappingURL=SearchPanel.js.map