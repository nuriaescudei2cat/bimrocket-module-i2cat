/**
 * ProcessingPermitsTool.js
 *Probauser@1
 * @author alexis-i2cat
 */

import { Tool } from "platform/ui/Tool.js";
import { OpenModelAction } from "modules/base/ui/file/OpenModelAction.js";
import { SaveModelAction } from "modules/base/ui/file/SaveModelAction.js";
import { ToolManager } from "../utils/ToolManager.js";
import { DeleteProjectDirectoryAction } from "../ui/file/DeleteProjectDirectoryAction.js";
import { deleteProcessingPermitsDirectory } from "../io/DeleteProjectDirectoryService.js";
import { FileExplorerEnhanced } from "../ui/file/FileExplorerEnhanced.js";

class ProcessingPermitsTool extends Tool
{
  constructor(application, options)
  {
    super(application);
    this.name = "processing_permits";
    this.label = "i2cat|tool.processing_permits.label";
    this.help = "i2cat|tool.processing_permits.help";
    this.className = "processing_permits";
    this.iconName = "i2cat|processing_permits";
    this.setOptions(options);
    this.immediate = true;

    application.addTool(this);

    const fileExplorer = new FileExplorerEnhanced(application, true);
    this.fileExplorer = fileExplorer;
    this.panel = fileExplorer;
    fileExplorer.tool = this;
    fileExplorer.id = "processing_permits";
    fileExplorer.title = this.label;

    application.panelManager.addPanel(fileExplorer);

    const contextMenu = fileExplorer.contextMenu;
    const action = fileExplorer.createContextAction;

    const deleteItem = contextMenu.getMenuItem("action.delete");
    if (deleteItem) deleteItem.remove();

    contextMenu.addMenuItem(action(DeleteProjectDirectoryAction, {
      deleteDirectoryHandler: (path, projectId, context) =>
        deleteProcessingPermitsDirectory(path, projectId, context),
    }), "general");

    contextMenu.addMenuItem(action(OpenModelAction), "default");

    contextMenu.addMenuItem(action(SaveModelAction), "save");

    const itemsToRemove = [
      "action.download_file",
      "action.copy",
      "action.cut",
      "action.paste",
      "action.rename",
      "action.upload_file",
    ];

    ToolManager.removeFileExplorerItems(contextMenu, itemsToRemove);
    
  }

  execute()
  {
    this.fileExplorer.tool = this;
    this.fileExplorer.visible = true;
    if (this.fileExplorer.service === null)
    {
      this.fileExplorer.goHome();
    }
  }

}

export { ProcessingPermitsTool };
