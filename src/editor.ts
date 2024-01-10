import * as vscode from "vscode";

export class ClassicEditorProvider implements vscode.CustomTextEditorProvider {
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new ClassicEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      ClassicEditorProvider.viewType,
      provider
    );
    return providerRegistration;
  }

  private static readonly viewType = "markdown-preview-editor.classicEditor";

  constructor(private readonly context: vscode.ExtensionContext) {}

  //Called when our custom editor is opened.
  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    // Setup initial content for the webview
    console.log("resolve triggered");
    webviewPanel.webview.options = {
      enableScripts: true,
    };
    webviewPanel.webview.html = this.getHtmlForWebview(
      webviewPanel.webview,
      document
    );

    function updateWebview() {
      webviewPanel.webview.postMessage({
        type: "update",
        text: document.getText(),
      });
    }

    // Hook up event handlers so that we can synchronize the webview with the text document.
    //
    // The text document acts as our model, so we have to sync change in the document to our
    // editor and sync changes in the editor back to the document.
    //
    // Remember that a single text document can also be shared between multiple custom
    // editors (this happens for example when you split a custom editor)

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
      (e) => {
        // only update our webview if the change did not originate in our webview (we'll use webview.active to determine this)
        if (
          !webviewPanel.active &&
          e.document.uri.toString() === document.uri.toString()
        ) {
          console.log("vscode txt doc changed");
          updateWebview();
        }
      }
    );

    // Make sure we get rid of the listener when our editor is closed.
    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    webviewPanel.webview.onDidReceiveMessage((e) => {
      switch (e.type) {
        case "data.change":
          console.log("vcode received data change message");
          this.updateTextDocument(document, e.data);
          return;
      }
    });
  }

  /**
   * Get the static html used for the editor webviews.
   */
  private getHtmlForWebview(
    webview: vscode.Webview,
    document: vscode.TextDocument
  ): string {
    console.log("get HTML triggered");

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "customEditor.js")
    );

    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "custom.css")
    );
    var ready = JSON.stringify(document.getText())
      .slice(1, -1)
      .replace(/(?:\\[rn])+/g, "<br/>");

    return /* html */ `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Markdown Editor</title>
			</head>
			<body>
            <div id="editor">${ready}</div>
              <script src="https://cdn.ckeditor.com/ckeditor5/40.2.0/super-build/ckeditor.js"></script>
              
                <link rel="stylesheet" href="${styleUri}">				
				        <script src="${scriptUri}"></script>
			</body>
			</html>`;
  }

  private updateTextDocument(document: vscode.TextDocument, md: any) {
    const edit = new vscode.WorkspaceEdit();

    // todo: compute minimal edits
    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.lineCount, 0),
      md
    );

    return vscode.workspace.applyEdit(edit);
  }
}
