/**
 * SelectByViewPanel.js
 *
 * @author nuriaescudei2cat
 * @author alexis-i2cat
 */

import { Panel } from "platform/ui/panel/Panel.js";
import { I18N } from "platform/i18n/I18N.js";
import { Controls } from "platform/ui/Controls.js";
import { Result } from "platform/io/FileService.js";
import { Toast } from "platform/ui/toast/Toast.js";
import { ErrorHandler } from "platform/ui/ErrorHandler.js";

class SelectByViewPanel extends Panel
{
  constructor(application, tool, options = {})
  {
    super(application);
    this.application = application;

    this.id = tool.name;
    this.title = tool.label;
    this.iconName = tool.iconName;
    this.tool = tool;
    this.position = "left";

    this.defaultHeight = 200;
    this.defaultMobileHeight = 200;
    this.minimumHeight = 200;

    this.options = options;
    this.views = options.views || {};
    this.selectedView = null;

    this.handleCloseButtonClick = this.handleCloseButtonClick.bind(this);

    this.createPanel();
  }

  createPanel()
  {
    this.helpElem = document.createElement("div");
    I18N.set(this.helpElem, "textContent", "i2cat|tool.select_by_view.select_view");
    this.helpElem.style.margin = "4px";
    this.bodyElem.appendChild(this.helpElem);

    this.viewOptions = Object.entries(this.views).map(([id, view]) => ({
      id: id,
      name: view.name,
      script: view.script,
    }));

    this.selectField = document.createElement("select");
    this.selectField.id = "select_view";
    this.selectField.name = "i2cat|select_view";

    this.selectedView = this.viewOptions.length > 0 ? this.viewOptions[0].value : null;

    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    I18N.set(emptyOption, "textContent", "i2cat|tool.select_by_view.select_option");
    this.selectField.appendChild(emptyOption);

    this.viewOptions.forEach(({ id, name }) =>
    {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = name;
      this.selectField.appendChild(option);
    });

    this.bodyElem.appendChild(this.selectField);
    // if (selectField.options.length > 1) selectField.selectedIndex = 1;

    this.selectField.addEventListener("change", (e) =>
    {
      const selectedId = e.target.value;
      this.selectedView = selectedId;
    });
    this.selectField.style.margin = "4px";

    Controls.addButton(this.bodyElem,
      "select_by_view_run", "button.run", () => this.runViewValidation());

    this.messageElem = document.createElement("div");
    this.messageElem.style.margin = "4px";
    this.bodyElem.appendChild(this.messageElem);

    if (this.closeButtonElem)
    {
      this.closeButtonElem.addEventListener("click", this.handleCloseButtonClick);
    }
  }

  handleCloseButtonClick()
  {
    this.loadViewScript("reset.js");
  }

  runViewValidation()
  {
    this.messageElem.textContent = "";
    const baseChildren = this.application.baseObject.children;
    if (baseChildren.length > 0)
    {
      this.modelObject = baseChildren[0];
      if (this.modelObject.userData.IFC?.GlobalId) return this.loadViewScript();
    }
    const errorKey = "i2cat|tool.select_by_view.validation_model_error";
    const errorMessage = this.application.i18n.get(errorKey) || errorKey;
    this.handleError(new Error(errorMessage), false, null);
  }

  loadViewScript(scriptOverride = null)
  {
    if (!this.selectedView && !scriptOverride)
    {
      const errorKey = "i2cat|tool.select_by_view.validation_option_error";
      const errorMessage = this.application.i18n.get(errorKey) || errorKey;
      this.handleError(new Error(errorMessage), false, null);
      return;
    }

    const selectedViewObj = this.viewOptions.find(view => view.id === this.selectedView);

    const scriptView = scriptOverride || selectedViewObj?.script;

    if (!scriptView)
    {
      const errorKey = "i2cat|tool.select_by_view.validation_view_error";
      const errorMessage = this.application.i18n.get(errorKey) || errorKey;
      this.handleError(new Error(errorMessage), false, null);
      return;
    }

    const service = this.application.services.script.scripts;

    service.read(scriptView, result =>
    {
      if (result.status === Result.ERROR || !result.data)
      {
        console.error("Error loading script: ", result);
        const errorKey = "i2cat|tool.select_by_view.script_load_error";
        const errorMessage = this.application.i18n.get(errorKey) || errorKey;
        this.handleError(new Error(errorMessage), false, null);
      }
      else
      {
        try
        {
          const fn = new Function("model", "application", result.data);
          fn(this.modelObject, this.application);
          Toast.create("base|message.script_executed")
            .setI18N(this.application.i18n).show();
        }
        catch (error)
        {
          console.error("Script execution error:", error);
          const errorKey = "i2cat|tool.select_by_view.script_execution_error";
          const errorMessage = this.application.i18n.get(errorKey) || errorKey;
          this.handleError(new Error(errorMessage), false, null);
        }
      }
    }, () =>
    {
    }, error =>
    {
      this.handleError(error, false, () => this.loadViewScript(scriptOverride));
    });
  }

  handleError(error, isWriteAction, onResolved)
  {
    ErrorHandler.handleError(this.application, this.application.services.script?.scripts || this.application.services,
      error, isWriteAction, onResolved,
    );
  }

  showMessage(key, ...args)
  {
    I18N.set(this.messageElem, "textContent", key, ...args);
    this.application.i18n.update(this.messageElem);
    this.messageElem.style.color = "";
  }

  resetInputOptions()
  {
    this.selectField.selectedIndex = 0;
  }

}

export { SelectByViewPanel };
