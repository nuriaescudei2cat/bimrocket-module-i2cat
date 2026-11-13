/**
 * TaskTool.js
 *
 * @author alexis-i2cat
*/

import { Tool } from "platform/ui/Tool.js";
import { CreateTaskAction } from "../ui/file/CreateTaskAction.js";
import { FileExplorerEnhanced } from "../ui/file/FileExplorerEnhanced.js";

class TaskTool extends Tool
{
  constructor(application, options)
  {
    super(application);
    this.name = "task";
    this.label = "i2cat|tool.task.label";
    this.className = "task";
    this.iconName = "i2cat|task_script";

    this.setOptions(options);
    this.immediate = true;

    application.addTool(this);

    this.createPanel();
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

    const createMenu = contextMenu.getMenu("menu.file.create");
    createMenu.addMenuItem(action(CreateTaskAction,{ label : "i2cat|action.task" }));

    this.panel = fileExplorer;
  }

  execute()
  {
    const panel = this.panel;
    panel.visible = false;
    panel.title = this.label;
    panel.iconName = "i2cat|task_script";
    panel.tool = this;
    panel.activateGroup("task");
    panel.visible = true;
  }
}

export { TaskTool };
