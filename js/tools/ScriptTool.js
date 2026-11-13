import { ScriptTool } from "modules/base/tools/ScriptTool.js";
import { FileExplorerEnhanced } from "../ui/file/FileExplorerEnhanced.js";
import { RunScriptAction } from "modules/base/ui/file/RunScriptAction.js";
import { EditScriptAction } from "modules/base/ui/file/EditScriptAction.js";
import { CreateScriptAction } from "modules/base/ui/file/CreateScriptAction.js";

class ScriptToolCustom extends ScriptTool
{
  constructor (application, options)
  {
    super(application, options);
  }

  createPanel()
  {
    const application = this.application;
    const panelManager = application.panelManager;
    let fileExplorer = panelManager.getPanel("file_explorer_enhanced");
    if (!fileExplorer)
    {
      fileExplorer = new FileExplorerEnhanced(application);
      fileExplorer.id = "file_explorer_enhanced";
      panelManager.addPanel(fileExplorer);
    }
    const contextMenu = fileExplorer.contextMenu;
    const action = fileExplorer.createContextAction;

    contextMenu.addMenuItem(action(RunScriptAction), "default:top");
    contextMenu.addMenuItem(action(EditScriptAction), "edit");

    const createMenu = contextMenu.getMenu("menu.file.create");
    createMenu.addMenuItem(action(CreateScriptAction,
      { label : "base|action.script" }));
    this.panel = fileExplorer;
  }

}

export { ScriptToolCustom };
