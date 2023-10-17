import * as vscode from 'vscode';
import { readFileSync } from 'fs';
import { environment } from '../environtments/environment';

export class SearchPanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static currentPanel: SearchPanel | undefined;

	public static readonly viewType = 'chatGPTSearch';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private readonly _extensionPath: string;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri, extensionPath: string) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (SearchPanel.currentPanel) {
			SearchPanel.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			SearchPanel.viewType,
			this.viewType,
			column || vscode.ViewColumn.One,
			getWebviewOptions(extensionUri),
		);

		SearchPanel.currentPanel = new SearchPanel(panel, extensionUri, extensionPath);
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, extensionPath: string) {
		SearchPanel.currentPanel = new SearchPanel(panel, extensionUri, extensionPath);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, extensionPath: string) {
		this._panel = panel;
		this._extensionUri = extensionUri;
		this._extensionPath = extensionPath;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showErrorMessage(message.text);
						return;
				}
			},
			null,
			this._disposables
		);
	}

	public doRefactor() {
		// Send a message to the webview webview.
		// You can send any JSON serializable data.
		this._panel.webview.postMessage({ command: 'refactor' });
	}

	public dispose() {
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

	private _update() {
		this._panel.title = 'ChatGPT 3.5';
		this._panel.webview.html = this._getHtmlForWebview();
	}

	private _getHtmlForWebview() {

		const htmlPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media', 'search-panel.html');
		return readFileSync(htmlPathOnDisk.fsPath, 'utf8').toString().replace('<OPENAI_API_KEY>', environment.OPENAI_API_KEY);
	}
}

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
		// Enable javascript in the webview
		enableScripts: true,

		// And restrict the webview to only loading content from our extension's `media` directory.
		localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
	};
}