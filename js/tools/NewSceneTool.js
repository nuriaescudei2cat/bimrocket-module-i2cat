/**
 * NewSceneToolCustom.js
 *
 * @author alexis-i2cat
 */

import { NewSceneTool } from "modules/base/tools/NewSceneTool.js";
import { ConfirmDialog } from "platform/ui/dialog/ConfirmDialog.js";

class NewSceneToolCustom extends NewSceneTool
{
  execute()
  {
    const application = this.application;
    ConfirmDialog.create("base|tool.new_scene.label", "base|question.create_new_scene")
      .setI18N(application.i18n)
      .setAcceptLabel("button.yes")
      .setCancelLabel("button.no")
      .setAction(() =>
      {
        application.initScene();
        this.restartPanels();

        const outlinerTool = application.tools.outliner;
        const inspectorTool = application.tools.inspector;
        if (outlinerTool)
          outlinerTool.execute();
        if (inspectorTool)
          inspectorTool.execute();
        
        application.useTool(null);
      }).show();
  }

  restartPanels()
  {
    const panelManager = this.application.panelManager;

    panelManager._panels.forEach(panel =>
    {
      if (!panel.isPersistent)
      {
        panel.visible = false;
      }

      if (typeof panel.resetInputOptions === "function")
      {
        panel.resetInputOptions();
      }
    });
  }
}

export { NewSceneToolCustom };
