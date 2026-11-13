/**
 * UploadModelPanel.js
 *
 * @author nuriaescudei2cat
 * @author alexis-i2cat
 */

import { I18N } from "platform/i18n/I18N.js";
import { Controls } from "platform/ui/Controls.js";
import { IFCSTEPExporter } from "platform/io/ifc/IFCSTEPExporter.js";
import { ReportPanel } from "modules/analysis/ui/ReportPanel.js";
import { Result, ACL } from "platform/io/FileService.js";
import { Toast } from "platform/ui/toast/Toast.js";
import { Panel } from "platform/ui/panel/Panel.js";
import { ErrorHandler } from "platform/ui/ErrorHandler.js";
import { ServerSession } from "platform/io/ServerSession.js";

class UploadModelPanel extends Panel
{
  constructor(application, tool, options = {})
  {
    super(application);
    this.application = application;
    this.service = application.services;
    this.options = options;
    this.id = tool.name;
    this.title = tool.label;
    this.tool = tool;
    this.position = "left";

    this.defaultHeight = 350;
    this.defaultMobileHeight = 350;
    this.minimumHeight = 200;

    this.folderPermissions = options.folderPermissions || {};
    this.projectPermissionsACL = options.projectPermissionsACL || {};
    this.environment = options.environment;

    this.proceduresConfig = options.procedureRules || {};
    this.proceduresMap = this.proceduresConfig.procedures || {};

    this.selectedProcedureKey = "";
    this.selectedSubtramitKey = "";
    this.selectedZoneKey = "";

    this.warningItemsCount = 0;

    this.gisConfig = application.default_properties?.getGISLayers || (() => ({}));

    this.generatedPanels = [];
    this.executedRuleNames = [];

    this.createPanel();
  }

  createPanel()
  {
    this.helpElem = document.createElement("div");
    I18N.set(this.helpElem, "textContent", "i2cat|tool.upload_model.select_process");
    this.helpElem.style.margin = "4px";
    this.bodyElem.appendChild(this.helpElem);

    this.bodyElem.style.display = "flex";
    this.bodyElem.style.flexDirection = "column";
    this.bodyElem.style.gap = "8px";
    this.bodyElem.style.padding = "10px";
    this.bodyElem.style.height = "100%";

    this.selectProcedure = this.createSelect("select_procedure", "i2cat|tool.upload_model.select_option");

    Object.entries(this.proceduresMap).forEach(([key]) =>
    {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = key;
      this.selectProcedure.appendChild(option);
    });

    this.selectProcedure.addEventListener("change", (e) => this.onProcedureChange(e.target.value));
    this.bodyElem.appendChild(this.selectProcedure);

    this.selectSubtramit = this.createSelect("select_subtramit", "i2cat|message.upload_model.select_plant");
    this.selectSubtramit.style.display = "none";
    this.selectSubtramit.addEventListener("change", (e) => this.onSubtramitChange(e.target.value));
    this.bodyElem.appendChild(this.selectSubtramit);

    this.selectZone = this.createSelect("select_zone", "i2cat|message.upload_model.select_zone");
    this.selectZone.style.display = "none";
    this.selectZone.addEventListener("change", (e) => this.onZoneChange(e.target.value));
    this.bodyElem.appendChild(this.selectZone);

    const validateButton = Controls.addButton(this.bodyElem, "upload_model_validate", "i2cat|button.validate", () => this.startValidation());
    validateButton.style.width = "max-content";
    validateButton.style.margin = "auto";

    this.messageElem = document.createElement("div");
    this.bodyElem.appendChild(this.messageElem);

    this.sendElem = document.createElement("div");
    this.bodyElem.appendChild(this.sendElem);

    Controls.addButton(this.sendElem,
      "upload_model_send", "button.send", () => this.openFolder());
    this.enableSendControls(false);

    this.validationMessage = document.createElement("p");
    I18N.set(this.validationMessage, "textContent", "i2cat|tool.upload_model.validation_warning");
    this.validationMessage.style.color = "#f00";
    this.validationMessage.style.margin = "auto 4px";
    this.bodyElem.appendChild(this.validationMessage);
  }

  createSelect(id, i18n)
  {
    const select = document.createElement("select");
    select.id = id;
    const option = document.createElement("option");

    I18N.set(option, "textContent", i18n);

    select.appendChild(option);

    return select;
  }

  onProcedureChange(procedureKey)
  {
    this.selectedProcedureKey = procedureKey;

    this.resetSelect(this.selectSubtramit);
    this.resetSelect(this.selectZone);
    this.selectSubtramit.style.display = "none";
    this.selectZone.style.display = "none";

    if (!procedureKey) return;

    const procConfig = this.proceduresMap[procedureKey];

    if (procConfig && procConfig.subtramits)
    {
      Object.entries(procConfig.subtramits).forEach(([key]) =>
      {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = key;
        this.selectSubtramit.appendChild(option);
      });
      this.selectSubtramit.style.display = "block";
    }
  }

  onSubtramitChange(subKey)
  {
    this.selectedSubtramitKey = subKey;
    this.selectedZoneKey = "";

    this.resetSelect(this.selectZone);
    this.selectZone.style.display = "none";

    if (!subKey || !this.selectedProcedureKey) return;

    const procConfig = this.proceduresMap[this.selectedProcedureKey];
    const subConfig = procConfig.subtramits[subKey];

    if (subConfig && subConfig.zones)
    {
      Object.entries(subConfig.zones).forEach(([key]) =>
      {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = key;
        this.selectZone.appendChild(option);
      });
      this.selectZone.style.display = "block";
    }
  }

  onZoneChange(zoneKey)
  {
    this.selectedZoneKey = zoneKey;
  }

  resetSelect(selectElem)
  {
    while (selectElem.options.length > 1)
    {
      selectElem.remove(1);
    }
  }

  ensureProcedureSelected()
  {
    const errorKey = "i2cat|tool.upload_model.validation_option_error";
    const errorMessage = this.application.i18n.get(errorKey);

    if (!this.selectedProcedureKey)
    {
      this.handleError(new Error(errorMessage), false, null);
      return false;
    }

    const procedureConfiguration = this.proceduresMap[this.selectedProcedureKey];

    if (procedureConfiguration.subtramits && Object.keys(procedureConfiguration.subtramits).length > 0 && !this.selectedSubtramitKey)
    {
      this.handleError(new Error(errorMessage), false, null);
      return false;
    }

    if (this.selectedSubtramitKey)
    {
      const subConfig = procedureConfiguration.subtramits[this.selectedSubtramitKey];
      if (subConfig.zones && Object.keys(subConfig.zones).length > 0 && !this.selectedZoneKey)
      {
        this.handleError(new Error(errorMessage), false, null);
        return false;
      }
    }

    return true;
  }

  buildPath(...parts)
  {
    return parts
      .filter(part => part.trim() !== "" && part.trim() !== "./")
      .join("/");
  }

  collectReportDefinitions()
  {
    const definitions = [];

    const pushRule = (baseService, fullPath) =>
    {
      definitions.push({
        service: baseService,
        path: fullPath,
        title: fullPath.split("/").pop(),
      });
    };

    const globalConfig = this.proceduresConfig.general_rules;

    if (globalConfig?.rules)
    {
      const base = this.buildPath(globalConfig.folder);
      globalConfig.rules.forEach(r =>
        pushRule(this.service.report.reports, this.buildPath(base, r)),
      );
    }

    if (!this.selectedProcedureKey) return definitions;

    const procedureConfig = this.proceduresMap[this.selectedProcedureKey];
    const procedurePath = procedureConfig.folder || "";

    if (procedureConfig.general_rules?.rules)
    {
      const base = this.buildPath(procedurePath, procedureConfig.general_rules.folder || "");

      procedureConfig.general_rules.rules.forEach(r =>
        pushRule(this.service.report.reports, this.buildPath(base, r)),
      );
    }

    if (this.selectedSubtramitKey)
    {
      const subConfig = procedureConfig.subtramits?.[this.selectedSubtramitKey];
      if (subConfig?.rules)
      {
        const base = this.buildPath(
          procedurePath,
          procedureConfig.subtramits_folder,
          subConfig.folder || "",
          subConfig.general_folder || "",
        );

        subConfig.rules.forEach(r =>
          pushRule(this.service.report.reports, this.buildPath(base, r)),
        );
      }

      if (this.selectedZoneKey)
      {
        const zone = subConfig.zones?.[this.selectedZoneKey];
        if (zone?.rules)
        {
          const base = this.buildPath(
            procedurePath,
            procedureConfig.subtramits_folder,
            subConfig.folder || "",
            subConfig.zones_folder,
            zone.folder || "",
          );

          zone.rules.forEach(r =>
            pushRule(this.service.report.reports, this.buildPath(base, r)),
          );
        }
      }
    }

    const seen = new Set();
    return definitions.filter(definition =>
    {
      const key = definition.path;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async startValidation()
  {
    this.messageElem.textContent = "";
    this.enableSendControls(false);

    if (!this.ensureProcedureSelected()) return;

    this.clearPanels();
    this.executedRuleNames = [];

    const model = this.application.baseObject.children[0];
    if (model?.userData.IFC?.GlobalId)
    {
      this.modelObject = model;
      await this.loadReport();
      return;
    }

    const errorKey = "i2cat|tool.upload_model.validation_model_error";
    const errorMessage = this.application.i18n.get(errorKey);
    const error = new Error(errorMessage);
    this.handleError(error, false, () => this.startValidation());
  }

  async loadReport()
  {
    const definitions = this.collectReportDefinitions();
    this.executedRuleNames = definitions.map(definition => definition.path);

    if (!definitions.length)
    {
      const errorKey = "i2cat|tool.upload_model.validation_rule_error";
      const errorMessage = this.application.i18n.get(errorKey);
      this.handleError(new Error(errorMessage), false, null);
      return;
    }

    await this.procedureSelect(this.selectedProcedureKey);
    await this.layersLoad(this.selectedProcedureKey);

    this.showProgressBar("Reading...");

    const reportPanel = new ReportPanel(this.application);
    reportPanel.title = "Validation";
    reportPanel.defaultHeight = 350;
    reportPanel.defaultMobileHeight = 200;
    reportPanel.minimumHeight = 250;

    this.application.panelManager.addPanel(reportPanel);

    this.generatedPanels = [reportPanel];

    reportPanel.runReports(definitions, (panel) =>
    {
      this.application.progressBar.visible = false;

      const totalWarnings = panel.summary?.total?.warnCount || 0;
      const totalErrors = panel.summary?.total?.errorCount || 0;
      this.warningItemsCount = totalWarnings;

      const hasError = totalErrors > 0;

      if (hasError)
      {
        this.showError("i2cat|tool.upload_model.validation_output_error");
        this.enableSendControls(false);
      }
      else if (totalWarnings > 0)
      {
        this.showMessage("i2cat|tool.upload_model.validation_warning_success", totalWarnings);
        this.enableSendControls(true);
      }
      else
      {
        this.showMessage("i2cat|tool.upload_model.validation_success");
        this.enableSendControls(true);
      }
    });
  }

  clearPanels()
  {
    this.generatedPanels.forEach(panel =>
    {
      panel.visible = false;
      if (this.application.panelManager.removePanel)
      {
        this.application.panelManager.removePanel(panel.id);
      }
    });
    this.generatedPanels = [];
  }

  async procedureSelect(tramitKey)
  {
    try
    {
      this.application.useTool("gis");
      const tramitsSelector = document.getElementById("tramits");
      if (!tramitsSelector) return false;

      const optionIndex = Array.from(tramitsSelector.options).findIndex(opt => opt.value === tramitKey);
      if (optionIndex >= 0)
      {
        tramitsSelector.selectedIndex = optionIndex;
        tramitsSelector.dispatchEvent(new Event("change", { bubbles: true }));
        await this.proceduresUpdate();
        return true;
      }
      return false;
    }
    catch (error)
    {
      console.error("Error configurant tràmits:", error);
      return false;
    }
  }

  async proceduresUpdate()
  {
    try
    {
      const updateButton = document.querySelector("button[name='gis_update_layers']");
      if (updateButton)
      {
        updateButton.click();
        return true;
      }
      return false;
    }
    catch (error)
    {
      console.error("Error actualitzant capes GIS:", error);
      return false;
    }
  }

  async layersLoad(tramitId)
  {
    try
    {
      const gisConfig = this.gisConfig(tramitId);
      if (!gisConfig || !gisConfig.layers || gisConfig.layers.length === 0) return false;

      let lastActivationTime = Date.now();
      let layersActivated = 0;

      for (const categoria of gisConfig.layers)
      {
        if (categoria.children && categoria.children.length > 0)
        {
          for (const capa of categoria.children)
          {
            let PAUSE_LAYERS = 10000;
            if (capa.report === true)
            {
              if (capa.bufferSize) PAUSE_LAYERS = capa.bufferSize / 2.5;

              const timeSinceLast = Date.now() - lastActivationTime;
              lastActivationTime = Date.now();
              this.showProgressBar("Initializing layer loading");
              console.log(`Inici activació capa (Filla): ${capa.name}. Temps transcorregut des de l'última activació/pausa: ${timeSinceLast} ms`);

              const capaActivada = await this.layerActivate(capa.name);
              if (capaActivada) layersActivated++;
              this.showProgressBar(`Loading layer ${capa.name}.`);
              await new Promise(resolve => setTimeout(resolve, PAUSE_LAYERS));
            }
          }
        }
      }
      return layersActivated > 0;
    }
    catch (error)
    {
      console.error("Error activant capes per tràmit:", error);
      return false;
    }
  }

  async layerActivate(nomCapa)
  {
    const checkbox = document.querySelector(`input[type="checkbox"][name="${nomCapa}"]`);
    if (checkbox)
    {
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return true;
  }

  openFolder()
  {
    if (!this.ensureProcedureSelected()) return;

    this.getProjectData();
    this.saveAndUpload();
  }

  getProjectData()
  {
    const procedureConfig = this.proceduresMap[this.selectedProcedureKey];
    const baseFolder = procedureConfig.folder.replace(/\/$/, "");

    this.projectFolder = this.getProjectFolder();
    this.correctedProjectFolder = this.getCorrectedProjectFolderName();
    this.modelVersion = this.getModelName();
    this.folderName = `${baseFolder}/${this.correctedProjectFolder}`;

    const cleanBaseUrl = this.application.element.baseURI.split("?")[0].split("#")[0];
    const path = `${this.folderName}/${this.modelVersion}`;
    this.absolutePath = `${cleanBaseUrl}?url=${encodeURIComponent(path)}&tool=zoom_all`;
  }

  async saveAndUpload()
  {
    const service = this.service.model.models;

    const progressBar = this.application.progressBar;
    progressBar.message = this.application.i18n.get("i2cat|tool.upload_model.verifying_project");
    progressBar.visible = true;

    try
    {
      const folderExists = await this.checkFolderExists(service);
      const projectDataResult = await this.checkProjectDataExists();
      const projectDataExists = projectDataResult !== null && !projectDataResult.error;

      if (projectDataExists && this.isProjectAssignedToOtherProcedure(projectDataResult))
      {
        const existingTramit = this.getProjectProcedure(projectDataResult) || "";
        const errorKey = "i2cat|message.upload_model.project_in_other_tramit";
        const errorMessage = this.application.i18n.get(
          errorKey,
          existingTramit,
        );
        this.handleError(new Error(errorMessage), false, null);
        progressBar.visible = false;
        return;
      }

      if (!folderExists)
      {
        await this.createFolderStructure(service);
        await this.uploadModel(service);
        this.createProject(this.service.task_executions.tasks);
      }
      else if (folderExists && !projectDataExists)
      {
        await this.uploadModel(service);
        this.createProject(this.service.task_executions.tasks);
      }
      else if (folderExists && projectDataExists)
      {
        if (projectDataResult.status === "faseRequerimentProjectista")
        {
          await this.uploadModel(service);
          this.updateProjectVersion(this.service.task_executions.tasks);
        }
        else
        {
          const errorKey = "i2cat|message.upload_model.upload_phase_error";
          const errorMessage = this.application.i18n.get(errorKey);
          this.handleError(new Error(errorMessage), false, null);
          progressBar.visible = false;
        }
      }
    }
    catch (error)
    {
      this.handleError(error, false, () => this.saveAndUpload());
    }
  }

  uploadModel(service)
  {
    this.application.progressBar.message = this.application.i18n.get("i2cat|tool.upload_model.uploading_model");
    return new Promise((resolve) =>
    {
      const modelAsText = this.exportModel();
      const path = `${this.folderName}/${this.modelVersion}`;
      service.save(path, modelAsText, result =>
      {
        if (result.status === Result.OK) resolve();
        else this.handleError(result.error, true, () => resolve(this.uploadModel(service)));
      });
    });
  }

  exportModel()
  {
    const ifcExporter = new IFCSTEPExporter();
    return ifcExporter.parse(this.modelObject, { reuseIfcFile: 2 });
  }

  getProjectFolder()
  {
    return this.modelObject.userData.IFC.GlobalId;
  }

  getCorrectedProjectFolderName()
  {
    return this.getProjectFolder().replace(/\$/g, "-");
  }

  getModelName()
  {
    return `model-${new Date().toISOString()}.ifc`;
  }

  enableSendControls(enable)
  {
    this.sendElem.style.display = enable ? "" : "none";
  }

  showMessage(key, ...args)
  {
    I18N.set(this.messageElem, "textContent", key, ...args);
    this.application.i18n.update(this.messageElem);
    this.messageElem.style.color = "";
  }

  showError(message, ...args)
  {
    I18N.set(this.messageElem, "textContent", message, ...args);
    this.application.i18n.update(this.messageElem);
    this.messageElem.onclick = null;
    this.messageElem.classList.remove("message");
    this.messageElem.style.color = "red";
  }

  getProjectProcedure(projectData)
  {
    if (!projectData) return null;
    return projectData.tramit || projectData?.data?.tramit || null;
  }

  isProjectAssignedToOtherProcedure(projectData)
  {
    const projectTramit = this.getProjectProcedure(projectData);
    if (!projectTramit || !this.selectedProcedureKey) return false;
    return String(projectTramit) !== String(this.selectedProcedureKey);
  }

  showPathMessage(key, ...args)
  {
    const elem = this.messageElem;
    elem.style.color = "";
    this.injectCopyStyle();
    const toCopy = args[0];
    const displayArgs = [...args];
    if (typeof toCopy === "string")
    {
      displayArgs[0] = this.decodeURL(toCopy);
    }

    I18N.set(elem, "textContent", key, ...displayArgs);
    this.application.i18n.update(elem);
    elem.classList.add("message");
    I18N.set(elem, "title", "i2cat|message.upload_model.path_copy_title");
    this.application.i18n.update(elem);
    elem.onclick = () =>
    {
      if (navigator.clipboard && typeof toCopy === "string")
      {
        navigator.clipboard.writeText(toCopy)
          .then(() => Toast.create("i2cat|message.upload_model.path_copied").setI18N(this.application.i18n).show())
          .catch(err => console.warn("Error al copiar:", err));
      }
    };
  }

  decodeURL(value)
  {
    try
    {
      return decodeURIComponent(value);
    }
    catch (error)
    {
      return value;
    }
  }

  injectCopyStyle()
  {
    if (document.getElementById("copy-style")) return;
    const style = document.createElement("style");
    style.id = "copy-style";
    style.textContent = `.message { white-space: pre-line; user-select: text; cursor: pointer; position: relative; }
      .message::after { position: absolute; right: -1.5em; opacity: 0.5; font-size: 0.8em; }`;
    document.head.appendChild(style);
  }
  createProject(taskService)
  {
    const taskData = {
      taskName: "crear_projecte.js",
      input: {
        project_id: this.projectFolder,
        project_folder: this.correctedProjectFolder,
        currentVersion: this.modelVersion,
        autor: null,
        empresa: null,
        fitxersRegles: this.executedRuleNames,
        tramit: this.selectedProcedureKey,
        warnings: this.warningItemsCount,
      },
      waitTime: 5000,
    };

    taskService.createExecutions(taskData, result =>
    {
      console.log("proyecto creado:", result);

      let successMessageKey = "i2cat|tool.upload_model.upload_success";
      if (this.warningItemsCount > 0)
      {
        successMessageKey = "i2cat|tool.upload_model.upload_warning_success";
      }

      this.showPathMessage(successMessageKey, this.absolutePath);
      this.enableSendControls(false);
      this.application.progressBar.visible = false;
    }, error =>
    {
      console.error("Error creant les metadades del projecte: ", error);
      const errorKey = "i2cat|tool.upload_model.create_project_error";
      const errorMessage = this.application.i18n.get(errorKey);
      this.handleError(new Error(errorMessage), false, () => this.createProject(taskService));
      this.application.progressBar.visible = false;
    });
  }

  updateProjectVersion(taskService)
  {
    const taskData = {
      taskName: "update_current_version.js",
      input: {
        project_id: this.projectFolder,
        currentVersion: this.modelVersion,
        fitxersRegles: this.executedRuleNames,
        tramit: this.selectedProcedureKey,
        warnings: this.warningItemsCount,
      },
      waitTime: 5000,
    };

    taskService.createExecutions(taskData, result =>
    {
      console.log("versión actualizada:", result);
      this.showPathMessage("i2cat|tool.upload_model.upload_success", this.absolutePath);
      this.enableSendControls(false);
      this.application.progressBar.visible = false;
    }, error =>
    {
      console.error("Error actualizando versión del proyecto:", error);
      const errorKey = "i2cat|tool.upload_model.update_version_error";
      const errorMessage = this.application.i18n.get(errorKey);
      this.handleError(new Error(errorMessage), false, () => this.updateProjectVersion(taskService));
      this.application.progressBar.visible = false;

    });
  }
  checkFolderExists(service)
  {
    return new Promise((resolve) =>
    {
      service.read(this.folderName, result =>
      {
        if (result.status === Result.OK) resolve(true);
        else if (result.error.code === 4) resolve(false);
        else this.handleError(result.error, false, () => resolve(this.checkFolderExists(service)));
      });
    });
  }

  checkProjectDataExists()
  {
    const taskService = this.service.task_executions.tasks;
    const taskData = {
      taskName: "check_status_projecte.js",
      input: { project_id: this.projectFolder },
      waitTime: 5000,
    };

    return new Promise((resolve) =>
    {
      taskService.createExecutions(taskData, result => resolve(result.output), error => this.handleError(error, false, () => resolve(this.checkProjectDataExists())));
    });
  }

  createFolderStructure(service)
  {
    return new Promise((resolve) =>
    {
      service.makeCollection(this.folderName, async result =>
      {
        if (result.status === Result.OK)
        {
          await this.createACL(service);
          resolve();
        }
        else
        {
          this.handleError(result.error, true, () => resolve(this.createFolderStructure(service)));
        }
      });
    });
  }

  async createACL(service)
  {
    const rule = this.proceduresMap[this.selectedProcedureKey];
    let customPermissions = rule.permissions;
    if (!customPermissions) return;

    customPermissions = structuredClone(customPermissions);

    if (customPermissions.username)
    {
      const session = ServerSession.getSession(service);
      const realUsername = await new Promise(resolve => session.getUsername(resolve));
      customPermissions[realUsername] = customPermissions.username;
      delete customPermissions.username;
    }

    return new Promise((resolve) =>
    {
      try
      {
        const acl = new ACL(customPermissions);
        service.setACL(this.folderName, acl, aclResult =>
        {
          if (aclResult.status === Result.OK) resolve();
          else this.handleError(aclResult.error, true, () => resolve(this.createACL(service)));
        });
      }
      catch (error)
      {
        this.handleError(error, true, () => resolve(this.createACL(service)));
      }
    });
  }

  handleError(error, isWriteAction, onResolved)
  {
    let originalSpinnerVisibility = this.application.progressBar.visible;
    this.application.progressBar.visible = false;

    let onResolvedWithProgress = null;

    if (onResolved)
    {
      onResolvedWithProgress = async () =>
      {
        await onResolved();
        this.application.progressBar.visible = originalSpinnerVisibility;
      };
    }

    ErrorHandler.handleError(this.application, this.service.model?.models || this.service,
      error, isWriteAction, onResolvedWithProgress);
  }

  onShow()
  {
    try
    {
      this.selectProcedure.focus();
    }
    catch (error)
    {
      this.hide();
    }
  }

  setProgress(progress, message)
  {
    this.application.progressBar.progress = progress;
    if (message)
    {
      this.application.progressBar.message = message;
    }
  }

  showProgressBar(message = "")
  {
    this.application.progressBar.message = message;
    this.application.progressBar.progress = undefined;
    this.application.progressBar.visible = true;
  }

  resetInputOptions()
  {

    this.selectProcedure.selectedIndex = 0;
    this.selectedProcedureKey = "";
    this.selectedSubtramitKey = "";
    this.selectedZoneKey = "";

    if (this.selectSubtramit)
    {
      this.resetSelect(this.selectSubtramit);
      this.selectSubtramit.style.display = "none";
    }

    if (this.selectZone)
    {
      this.resetSelect(this.selectZone);
      this.selectZone.style.display = "none";
    }
    if (this.messageElem)
    {
      this.messageElem.textContent = "";
    }
    this.enableSendControls(false);
  }
}

export { UploadModelPanel };
