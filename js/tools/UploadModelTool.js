/**
 * UploadModelTool.js
 *
 * @author nuriaescudei2cat
 */

import { Tool } from "platform/ui/Tool.js";
import { UploadModelPanel } from "../ui/UploadModelPanel.js";

class UploadModelTool extends Tool
{
  constructor(application, options)
  {
    super(application);
    this.name = "upload_model";
    this.label = "i2cat|tool.upload_model.label";
    this.className = "upload_model";
    this.iconName = "i2cat|upload_model";
    this.setOptions(options);
    application.addTool(this);

    this.uploadModelPanel = new UploadModelPanel(application, this, options);
    this.uploadModelPanel.tool = this;
    this.panel = this.uploadModelPanel;
    
    application.panelManager.addPanel(this.uploadModelPanel);
  }

  activate()
  {
    this.uploadModelPanel.visible = true;
  }

  deactivate()
  {
    this.uploadModelPanel.visible = false;
  }

}

export { UploadModelTool };
