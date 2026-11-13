/**
 * BCFToolCustom.js
 *
 * @author alexis-i2cat
 */

import { Tool } from "platform/ui/Tool.js";
import { BCFPanelCustom } from "../ui/BCFPanel.js";

class BCFToolCustom extends Tool
{
  constructor(application, options)
  {
    super(application);
    this.name = "bcf";
    this.label = "bim|tool.bcf.label";
    this.help = "bim|tool.bcf.help";
    this.className = "bcf";
    this.iconName = "bim|bcf";
    this.setOptions(options);
    this.immediate = true;

    this.panel = new BCFPanelCustom(this.application);
    this.panel.tool = this;
    application.panelManager.addPanel(this.panel);
  }

  execute()
  {
    this.panel.visible = true;
  }
}

export { BCFToolCustom };
