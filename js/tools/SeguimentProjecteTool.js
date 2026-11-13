/**
 * SeguimentProjecteTool.js
 * Previous cloud explorer
 *
 * @author nuriaescudei2cat
 * @author alexis-i2cat
 */

import { Tool } from "platform/ui/Tool.js";
import { OpenModelAction } from "modules/base/ui/file/OpenModelAction.js";
import { FileExplorerEnhanced } from "../ui/file/FileExplorerEnhanced.js";


class SeguimentProjecteTool extends Tool
{
  constructor(application, options)
  {
    super(application);
    this.name = "seguiment_projecte";
    this.label = "i2cat|tool.seguiment_projecte.label";
    this.help = "i2cat|tool.seguiment_projecte.help";
    this.iconName = "i2cat|cloud_explorer";

    this.setOptions(options);
    this.immediate = true;

    application.addTool(this);
    this.createPanel();
  }

  createPanel()
  {
    const application = this.application;
    const panelManager = this.application.panelManager;
    let fileExplorer = panelManager.getPanel("file_explorer_enhanced");
    if (!fileExplorer)
    {
      fileExplorer = new FileExplorerEnhanced(application);
      fileExplorer.id = "file_explorer_enhanced";
      panelManager.addPanel(fileExplorer);
    }
    const contextMenu = fileExplorer.contextMenu;
    const action = fileExplorer.createContextAction;

    contextMenu.addMenuItem(action(OpenModelAction), "default");

    this.panel = fileExplorer;
  }

  execute()
  {
    const panel = this.panel;
    panel.visible = false;
    panel.title = this.label;
    panel.iconName = this.iconName;
    panel.tool = this;
    panel.activateGroup("seguiment_projectes");
    panel.visible = true;
  }
}

export { SeguimentProjecteTool };
