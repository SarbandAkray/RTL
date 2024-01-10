// todo: move this stuff out to a separate script like vscode custom editor example /media directory
const vscode = acquireVsCodeApi();

// This sample still does not showcase all CKEditor&nbsp;5 features (!)
// Visit https://ckeditor.com/docs/ckeditor5/latest/features/index.html to browse all the features.

CKEDITOR.ClassicEditor.create(document.getElementById("editor"), {
  language: "ar",
  removePlugins: [
    "AIAssistant",
    "CKBox",
    "CKFinder",
    "EasyImage",
    "RealTimeCollaborativeComments",
    "RealTimeCollaborativeTrackChanges",
    "RealTimeCollaborativeRevisionHistory",
    "PresenceList",
    "Comments",
    "TrackChanges",
    "TrackChangesData",
    "RevisionHistory",
    "Pagination",
    "WProofreader",
    "MathType",
    "SlashCommand",
    "Template",
    "DocumentOutline",
    "FormatPainter",
    "TableOfContents",
    "PasteFromOfficeEnhanced",
    "HTMLFullDocument",
  ],
})
  .then((editor) => {
    editor.model.document.on("change:data", (ei, b) => {
      editor.execute("textPartLanguage", { languageCode: "ar" });
      if (b.type !== "transparent") {
        // const editorText = editor.editing.view.getDomRoot().innerText;

        const editorText = editor.editing.view.getDomRoot().innerText;
        console.log(editorText);
        vscode.postMessage({
          type: "data.change",
          data: editorText,
        });

        vscode.setState({ editorText });
      }
    });

    // Handle messages sent from the extension to the webview
    window.addEventListener("message", (event) => {
      const message = event.data; // The data that the extension sent
      switch (message.type) {
        case "update":
          console.log("webview received update notification");
          const text = message.text;

          // Update our webview's content
          updateContent(text);

          vscode.setState({ text });

          return;
        case "updateFirstTime":
          console.log(message.text);
          updateContent(message.text);
          return;
      }
    });

    /**
     * Render the document in the webview.
     */
    function updateContent(/** @type {string} */ text) {
      console.log("webview received content update");
      var ready = JSON.stringify(text)
        .slice(1, -1)
        .replace(/(?:\\[rn])+/g, "<br/>");
      editor.setData(`<pre>${ready}</pre>`);
    }

    // Webviews are normally torn down when not visible and re-created when they become visible again.
    // State lets us save information across these re-loads
    const state = vscode.getState();
    if (state) {
      updateContent(state.text);
      console.log(state.text);
    }
  })
  .catch((error) => {
    console.error(error);
  });
