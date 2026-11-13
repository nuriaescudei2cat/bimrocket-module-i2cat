/*
 * SelectByViewTool.js
 *
 */

import { Tool } from "platform/ui/Tool.js";
import { SelectByViewPanel } from "../ui/SelectByViewPanel.js";

class SelectByViewTool extends Tool
{
  constructor(application, options)
  {
    super(application);
    this.name = "select_by_view";
    this.label = "i2cat|tool.select_by_view.label";
    this.className = "select_by_view";
    this.iconName = "i2cat|select_by_view";
    this.views = options.views || [];
    
    this.setOptions(options);
    application.addTool(this);

    this.panel = new SelectByViewPanel(application, this, options);
    application.panelManager.addPanel(this.panel);
  }

  activate()
  {
    this.panel.visible = true;
  }

  deactivate()
  {
    this.panel.visible = false;
  }
}
export { SelectByViewTool };
