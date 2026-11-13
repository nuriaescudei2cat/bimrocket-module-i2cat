/*
 * GISTool.js
 *
 */

import { Tool } from "platform/ui/Tool.js";
import { GISPanel } from "../ui/GISPanel.js";

class GISTool extends Tool
{
  constructor(application, options)
  {
    super(application);
    this.name = "gis";
    this.label = "i2cat|tool.gis.label";
    this.help = "i2cat|tool.gis.help";
    this.className = "gis";
    this.iconName = "i2cat|gis";
    this.setOptions(options);
    application.addTool(this);
    this.immediate = true;

    this.panel = new GISPanel(this.application, this);
    this.panel.tool = this;
    application.panelManager.addPanel(this.panel);
  }

  execute()
  {
    this.panel.visible = true;
  }
}

export { GISTool };
