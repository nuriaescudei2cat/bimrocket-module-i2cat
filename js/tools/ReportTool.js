import { ReportTool } from "modules/analysis/tools/ReportTool.js";
import { FileExplorerEnhanced } from "../ui/file/FileExplorerEnhanced.js";
import { RunReportAction } from "modules/analysis/ui/file/RunReportAction.js";
import { EditReportAction } from "modules/analysis/ui/file/EditReportAction.js";
import { CreateReportAction } from "modules/analysis/ui/file/CreateReportAction.js";

class ReportToolCustom extends ReportTool
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
      panelManager.addPanel(fileExplorer);
    }

    const contextMenu = fileExplorer.contextMenu;
    const action = fileExplorer.createContextAction;

    contextMenu.addMenuItem(action(RunReportAction), "default:top");
    contextMenu.addMenuItem(action(EditReportAction), "edit:top");

    const createMenu = contextMenu.getMenu("menu.file.create");
    createMenu.addMenuItem(action(CreateReportAction,
      { label : "analysis|action.report" }));

    this.panel = fileExplorer;
  }
}

export { ReportToolCustom };
