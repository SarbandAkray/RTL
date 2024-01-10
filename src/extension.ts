import * as vscode from "vscode";
import { ClassicEditorProvider } from "./editor";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(ClassicEditorProvider.register(context));
}

export function deactivate() {}
