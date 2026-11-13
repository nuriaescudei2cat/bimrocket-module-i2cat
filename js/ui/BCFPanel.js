/**
 * BCFPanelCustom.js
 *
 * @author alexis-i2cat
 */

import { BCFPanel } from "modules/bim/ui/BCFPanel.js";
import { Controls } from "platform/ui/Controls.js";
import { Toast } from "platform/ui/toast/Toast.js";
import { I18N } from "platform/i18n/I18N.js";

export class BCFPanelCustom extends BCFPanel
{
  constructor(application)
  {
    super(application);

    // Cambios UI
    this.bcfServiceElem.parentElement.style.display = "none";
    this.connButtonsElem.style.display = "none";
    this.filterVisibilityButton.checked = true;

    // Variables
    this.taskService = this.application.services?.task_executions?.tasks;
    this.isStarted = false;
    const topicTypes = this.application.default_properties?.getSeguimentProjecteChecklistType?.();
    const configuredChecklistTypes = topicTypes?.BCFPanel?.topic_type || topicTypes?.topic_type;
    this.checklistTypes = Array.isArray(configuredChecklistTypes) ? configuredChecklistTypes : [];

    const createButtonGroup = (titleGroupKey) =>
    {
      const group = document.createElement("div");
      group.style.cssText = "margin-top: 2.5px; border-top: 1px solid #d0d0d0;";

      const legend = document.createElement("div");
      I18N.set(legend, "textContent", titleGroupKey);
      this.application.i18n.update(legend);

      group.appendChild(legend);
      this.saveExtensionsButtonsElem.appendChild(group);

      return group;
    };

    // Peticions internes
    this.groupRequirements = createButtonGroup("i2cat|label.review_status_change");

    this.startInternalPetitionsButton = Controls.addButton(
      this.groupRequirements, "startInternal", "i2cat|button.start_internal_petitions",
      () => this.handleStatusChange("startInternalPetitions")
    );
    this.endInternalPetitionsButton = Controls.addButton(
      this.groupRequirements, "endInternal", "i2cat|button.end_internal_petitions",
      () => this.handleStatusChange("endInternalPetitions")
    );
    this.initRequirementButton = Controls.addButton(
      this.groupRequirements, "initReq", "i2cat|button.init_requirement",
      () => this.handleStatusChange("initRequirement")
    );
    this.endRequirementButton = Controls.addButton(
      this.groupRequirements, "endReq", "i2cat|button.end_requirement",
      () => this.handleStatusChange("endRequirement")
    );
    this.startPublicPhaseButton = Controls.addButton(
      this.groupRequirements, "startPublic", "i2cat|button.init_public_phase",
      () => this.handleStatusChange("startPublicPhase")
    );

    // Seguiment de projecte
    this.groupSeguiment = createButtonGroup("i2cat|label.project_tracking");

    this.endPreprojectStartBasicButton = Controls.addButton(
      this.groupSeguiment, "endPreprojectStartBasic", "i2cat|button.end_preproject_start_basic",
      () => this.handlePhaseChange("endPreprojectStartBasic")
    );
    this.endBasicStartExecutiveButton = Controls.addButton(
      this.groupSeguiment, "endBasicStartExecutive", "i2cat|button.end_basic_start_executive",
      () => this.handlePhaseChange("endBasicStartExecutive")
    );
    this.endExecutiveButton = Controls.addButton(
      this.groupSeguiment, "endExecutive", "i2cat|button.end_executive",
      () => this.handlePhaseChange("endExecutive")
    );

    // Desat definitiu
    this.groupSave = createButtonGroup("i2cat|label.final_save");

    this.saveModelButton = Controls.addButton(
      this.saveExtensionsButtonsElem, "saveModel", "i2cat|button.save_model_to_db",
      () => this.handleSaveModelToDb(),
    );

    // Checklist
    this.checklistPanel = this.tabbedPane.addTab("checklist", "i2cat|tab.checklist");
    this.checklistFormContainer = document.createElement("div");
    this.checklistPanel.appendChild(this.checklistFormContainer);

    const onTopicTypeChange = (event) =>
    {
      this.handleTopicTypeChange(event.target.value, null);
    };
    this.topicTypeElem.addEventListener("change", onTopicTypeChange);
    this.projectStatusButton = Controls.addButton(
      this.filterButtonsElem, "projectStatus", "i2cat|button.project_status",
      () => this.showProjectStatusPanel(),
    );

    this.projectStatusPanelElem = document.createElement("div");
    this.projectStatusPanelElem.id = "bcf_project_status_panel";
    this.projectStatusPanelElem.className = "bcf-panel";
    this.projectStatusPanelElem.style.display = "none";
    this.bodyElem.appendChild(this.projectStatusPanelElem);

    this.projectStatusBodyElem = document.createElement("div");
    this.projectStatusBodyElem.className = "bcf-body bcf_project_status_body";
    this.projectStatusPanelElem.appendChild(this.projectStatusBodyElem);

    this.projectStatusHeaderElem = document.createElement("div");
    this.projectStatusHeaderElem.className = "bcf-topic-nav";
    this.projectStatusBodyElem.appendChild(this.projectStatusHeaderElem);

    this.backProjectStatusButton = Controls.addButton(
      this.projectStatusHeaderElem, "backProjectStatus", "button.back",
      () => this.showTopicList(),
    );

    this.projectStatusTitleElem = document.createElement("span");
    this.projectStatusTitleElem.className = "bcf_project_status_title";
    this.projectStatusHeaderElem.appendChild(this.projectStatusTitleElem);

    this.projectStatusContentElem = document.createElement("div");
    this.projectStatusContentElem.className = "bcf_project_status_content";
    this.projectStatusBodyElem.appendChild(this.projectStatusContentElem);

    this.openChecklistTopicButton = Controls.addButton(
      this.projectStatusBodyElem, "openChecklistTopic", "i2cat|button.open_checklist_topic",
      () => this.openChecklistTopic(),
    );
    this.openChecklistTopicButton.style.display = "none";

    this.templateCache = new Map();
    this.projectStatusData = null;
  }

  // =============================
  // MÉTODOS SOBRESCRITOS
  // =============================

  onShow()
  {
    this.refreshServices();

    if (this.service && !this.isStarted)
    {
      this.refreshProjects();
    }
    this.isStarted = true;
  }

  showTopic(topic = null, index = -1)
  {
    super.showTopic(topic, index);

    const currentType = topic ? topic.topic_type : this.topicTypeElem.value;
    this.handleTopicTypeChange(currentType, topic);
  }

  saveTopic()
  {
    const application = this.application;
    let projectId = this.getProjectId();
    let topicGuid = this.guidElem.value;
    let topic = {
      "title": this.titleElem.value,
      "topic_type": this.topicTypeElem.value,
      "priority": this.priorityElem.value,
      "topic_status": this.topicStatusElem.value,
      "stage": this.stageElem.value,
      "assigned_to": this.assignedToElem.value,
      "description": this.descriptionElem.value,
      "due_date": this.addTime(this.dueDateElem.value),
    };

    if (this.checklistTypes.includes(topic.topic_type))
    {
      let propertiesJSON = {};
      const inputs = this.checklistFormContainer.querySelectorAll("input, select, textarea");

      inputs.forEach(input =>
      {
        const key = input.id || input.name;
        if (key)
        {
          if (input.type === "checkbox")
          {
            propertiesJSON[key] = input.checked;
          }
          else
          {
            propertiesJSON[key] = input.value;
          }
        }
      });

      topic.description = JSON.stringify(propertiesJSON);
    }

    const onCompleted = savedTopic =>
    {
      this.hideProgressBar();
      this.showTopic(savedTopic, this.index);
      if (this.topics && this.index >= 0)
      {
        this.topics[this.index] = savedTopic;
      }
      Toast.create("bim|message.topic_saved").setI18N(application.i18n).show();
    };

    const onError = error =>
    {
      this.handleError(error, () => this.saveTopic());
    };

    this.showProgressBar();
    if (topicGuid)
    {
      this.service.updateTopic(projectId, topicGuid, topic, onCompleted, onError);
    }
    else
    {
      this.service.createTopic(projectId, topic, onCompleted, onError);
    }
  }

  showTopicList()
  {
    this.projectStatusPanelElem.style.display = "none";
    super.showTopicList();
  }

  // =============================
  // MÈTODES ADDICIONALS
  // =============================

  // HANDLER PER ESTATS
  handleStatusChange(statusType) 
  {
    const projectId = this.getProjectId();
    const statusConfig = this.getStatusConfig(statusType);
    if (!statusConfig) return this.handleError(new Error(`Unsupported status change: ${statusType}`));

    const { option, messageKey } = statusConfig;

    const onCompleted = (result) =>
    {
      this.hideProgressBar();
      const output = result.output;
      if (!output) return this.handleError({ message: result?.error || "Error processing task on backend." });

      console.log("Status actualitzat: ", output?.result_status?.status);

      this.extensions = output.result_extensions;
      this.populateExtensions();
      Controls.setCodeEditorDocument(this.extensionsView, JSON.stringify(this.extensions, null, 2), { language: "json" });
      Toast.create(messageKey).setI18N(this.application.i18n).show();
    };

    const onError = () =>
    {
      const errorKey = "i2cat|message.phase_error";
      const errorMessage = this.application.i18n.get(errorKey);
      this.handleError(new Error(errorMessage), () => this.handlePhaseChange(phaseType));
    };

    const taskData = {
      taskName: "peticions_internes.js",
      input: { opcio: option, project_id: projectId },
      waitTime: 5000,
    };

    try
    {
      this.showProgressBar();
      this.taskService.createExecutions(taskData, onCompleted, () =>
      {
        this.handleError(new Error("i2cat|message.phase_error"), () => this.handleStatusChange(statusType));
      });
    }
    catch (ex)
    {
      this.handleError(ex, () => this.handleStatusChange(statusType));
    }
  }

  // HANDLER PER FASES
  async handlePhaseChange(phaseType)
  {
    const projectId = this.getProjectId();
    const phaseConfig = this.getPhaseConfig(phaseType);
    if (!phaseConfig) return this.handleError(new Error(`Unsupported phase change: ${phaseType}`));

    const validationResult = await this.validatePhaseTransition(phaseConfig, projectId, phaseType);
    if (!validationResult.isValid)
    {
      this.notifyPhaseRequirementsError(validationResult.missingProperties);
      return;
    }

    const { option, messageKey } = phaseConfig;

    const onCompleted = (result) =>
    {
      this.hideProgressBar();
      const output = result.output;
      if (!output) return this.handleError({ message: result?.error || "Error processing task on backend." });

      console.log("Fase actualitzada: ", output?.result_phase);

      this.extensions = output.result_extensions;
      this.populateExtensions();
      Controls.setCodeEditorDocument(this.extensionsView, JSON.stringify(this.extensions, null, 2), { language: "json" });
      Toast.create(messageKey).setI18N(this.application.i18n).show();
    };

    const taskData = {
      taskName: "seguiment_projecte_phase_change.js",
      input: { opcio: option, project_id: projectId },
      waitTime: 5000,
    };

    try
    {
      this.showProgressBar();
      this.taskService.createExecutions(taskData, onCompleted, () =>
      {
        this.handleError(new Error("i2cat|message.phase_error"), () => this.handlePhaseChange(phaseType));
      });
    }
    catch (ex)
    {
      this.handleError(ex, () => this.handlePhaseChange(phaseType));
    }
  }

  getStatusConfig(statusType)
  {
    switch (statusType)
    {
      case "startInternalPetitions":
        return { option: 1, messageKey: "i2cat|message.extensions_start_internal" };
      case "endInternalPetitions":
        return { option: 2, messageKey: "i2cat|message.extensions_end_internal" };
      case "initRequirement":
        return { option: 3, messageKey: "i2cat|message.extensions_init_requirement" };
      case "endRequirement":
        return { option: 4, messageKey: "i2cat|message.extensions_end_requirement" };
      case "startPublicPhase":
        return { option: 5, messageKey: "i2cat|message.extensions_start_public_phase" };
      default:
        return null;
    }
  }

  getPhaseConfig(phaseType)
  {
    switch (phaseType)
    {
      case "fiAvantprojecte-iniciBasic":
      case "endPreprojectStartBasic":
        return { option: 6, messageKey: "i2cat|message.extensions_end_preproject_start_basic" };
      case "endBasicStartExecutive":
        return { option: 7, messageKey: "i2cat|message.extensions_end_basic_start_executive" };
      case "endExecutive":
        return { option: 8, messageKey: "i2cat|message.extensions_end_executive" };
      default:
        return null;
    }
  }

  async validatePhaseTransition(phaseConfig, projectId, phaseType)
  {
    const checklistTypeByPhaseIndex = {
      "fiAvantprojecte-iniciBasic": 0,
      endPreprojectStartBasic: 0,
      endBasicStartExecutive: 1,
      endExecutive: 2,
    };

    const expectedTopicIndex = checklistTypeByPhaseIndex[phaseType];
    if (expectedTopicIndex === undefined)
    {
      return { isValid: true, missingProperties: [] };
    }

    const expectedTopicType = this.checklistTypes[expectedTopicIndex] || "";

    if (!expectedTopicType)
    {
      console.warn("No checklist type configured for phase:", phaseType);
      return {
        isValid: false,
        missingProperties: ["No hi ha cap tipus de checklist configurat per aquesta fase"],
      };
    }

    const projectProperties = await this.getProjectPropertiesFromBCF(projectId, expectedTopicType);

    if (Object.keys(projectProperties).length === 0)
    {
      console.warn("No s'ha trobat el checklist o està buit.");
      return {
        isValid: false,
        missingProperties: ["El checklist no s'ha omplert o no existeix"],
        projectProperties
      };
    }

    const missingProperties = [];

    for (const [key, value] of Object.entries(projectProperties))
    {
      const isTextareaProperty = key.startsWith("comments_");
      if (isTextareaProperty) continue;

      if (value === false || value === "false")
      {
        missingProperties.push(key);
      }
      else if (typeof value === "string" && value.trim() === "")
      {
        missingProperties.push(key);
      }
    }

    return {
      isValid: missingProperties.length === 0,
      missingProperties,
      projectProperties,
    };
  }

  getProjectPropertiesFromBCF(projectId, expectedTopicType)
  {
    return new Promise((resolve, reject) =>
    {
      const onCompleted = (topics) =>
      {
        const checklistTopic = topics.find(t => t.topic_type === expectedTopicType);

        if (!checklistTopic || !checklistTopic.description)
        {
          console.warn(`No s'ha trobat cap checklist del tipus ${expectedTopicType} o està buida.`);
          return resolve({});
        }

        try
        {
          const properties = JSON.parse(checklistTopic.description);
          resolve(properties);
        }
        catch (e)
        {
          console.error("Error al parsejar la descripció del tòpic:", e);
          resolve({});
        }
      };

      const onError = (error) => reject(error);

      this.service.getTopics(projectId, "", "", onCompleted, onError);
    });
  }

  notifyPhaseRequirementsError(missingProperties)
  {
    Toast.create("i2cat|message.phase_requirements_missing")
      .setI18N(this.application.i18n)
      .setSize(420, 64)
      .show();

    console.warn("Phase change blocked. Missing properties:", missingProperties);
  }

  handleSaveModelToDb()
  {
    const projectId = this.getProjectId();

    const onCompleted = () =>
    {
      this.hideProgressBar();
      Toast.create("i2cat|message.model_saved_to_db")
        .setI18N(this.application.i18n).setSize(360, 64).show();
    };

    const onError = () =>
    {
      const errorKey = "i2cat|message.model_saved_to_db_error";
      const errorMessage = this.application.i18n.get(errorKey);
      this.handleError(new Error(errorMessage), () => this.handleSaveModelToDb());
    };

    const taskData = {
      taskName: "save_model_to_db.js",
      input: { project_id: projectId },
      waitTime: 5000,
    };

    try
    {
      this.showProgressBar();
      this.taskService.createExecutions(taskData, onCompleted, onError);
    }
    catch (ex)
    {
      this.handleError(ex, () => this.handleSaveModelToDb());
    }
  }

  async handleTopicTypeChange(topicType, topic = null)
  {
    const isChecklist = this.checklistTypes.some(
      type => type.toLowerCase() === (topicType || "").toLowerCase(),
    );
    if (isChecklist)
    {
      this.descriptionElem.parentElement.style.display = "none";
      this.checklistFormContainer.innerHTML = "<p style='padding: 10px;'>Carregant formulari...</p>";

      try
      {
        const processingPermitsService = this.application.services?.seguiment_projectes?.seguiment_projectes;
        const configuredChecklistPath = this.application.default_properties?.getSeguimentProjecteChecklistPath?.() || "/templates";
        const serviceBasePath = (processingPermitsService?.url || "/api/cloudfs/seguiment_projectes").replace(/\/+$/, "");

        let cleanTemplateSubpath = configuredChecklistPath.replace(/\/+$/, "");
        if (!cleanTemplateSubpath.startsWith("/")) cleanTemplateSubpath = "/" + cleanTemplateSubpath;

        const formUrl = `${serviceBasePath}${cleanTemplateSubpath}/${topicType}.html`;

        const response = await fetch(formUrl);

        if (!response.ok) throw new Error(`Error HTTP: ${response.status} - Plantilla no trobada a ${formUrl}`);

        const htmlTemplate = await response.text();
        this.checklistFormContainer.innerHTML = htmlTemplate;

        if (topic && topic.description)
        {
          try
          {
            let propertiesData = JSON.parse(topic.description);
            const inputs = this.checklistFormContainer.querySelectorAll("input, select, textarea");

            inputs.forEach(input =>
            {
              const key = input.id || input.name;
              if (key && propertiesData[key] !== undefined)
              {
                if (input.type === "checkbox")
                {
                  input.checked = propertiesData[key] === true || propertiesData[key] === "true";
                }
                else
                {
                  input.value = propertiesData[key];
                }
              }
            });
          }
          catch (e)
          {
            console.warn("La descripció no és un JSON vàlid per al checklist.");
          }
        }

      }
      catch (error)
      {
        console.error("Error carregant el checklist:", error);
        this.checklistFormContainer.innerHTML = `
          <div style="padding: 10px; margin-top: 10px; color: #d32f2f; background-color: #ffebee; border: 1px solid #ffcdd2; border-radius: 4px;">
            <p><b>No s'ha pogut carregar el formulari.</b></p>
            <p>Tipus: ${topicType}</p>
            <p><small>Verifica que l'arxiu .html existeixi a la ruta especificada del CloudService.</small></p>
          </div>
        `;
      }
    }
    else
    {
      this.descriptionElem.parentElement.style.display = "";
      this.checklistFormContainer.innerHTML = `
        <div style="padding: 10px; margin-top: 10px;">
          <p>Aquest tòpic no és de tipus Checklist. No hi ha cap formulari disponible.</p>
        </div>
      `;
    }
  }

  showProjectStatusPanel()
  {
    const projectId = this.getProjectId();
    if (!projectId)
    {
      Toast.create("i2cat|message.project_status_no_project")
        .setI18N(this.application.i18n).show();
      return;
    }

    this.searchPanelElem.style.display = "none";
    this.detailPanelElem.style.display = "none";
    this.setupPanelElem.style.display = "none";
    this.projectStatusPanelElem.style.display = "";

    this.renderProjectStatusLoading();

    this.loadProjectStatusSummary(projectId)
      .then(summary => this.renderProjectStatusSummary(summary))
      .catch(error =>
      {
        const errorKey = "i2cat|message.project_status_error";
        this.renderProjectStatusError(errorKey);
        this.handleError(error, () => this.showProjectStatusPanel());
      });
  }

  renderProjectStatusLoading()
  {
    this.projectStatusTitleElem.innerHTML = "";
    I18N.set(this.projectStatusTitleElem, "textContent", "i2cat|title.project_status_summary");
    this.application.i18n.update(this.projectStatusTitleElem);
    this.projectStatusContentElem.innerHTML = "";

    const loadingElem = document.createElement("p");
    I18N.set(loadingElem, "textContent", "i2cat|message.project_status_loading");
    this.application.i18n.update(loadingElem);
    this.projectStatusContentElem.appendChild(loadingElem);

    this.openChecklistTopicButton.style.display = "none";
    this.openChecklistTopicButton.disabled = true;
    this.openChecklistTopicButton.removeAttribute("title");
    if (this.openChecklistTopicButton.i18n)
    {
      delete this.openChecklistTopicButton.i18n.title;
    }
  }

  renderProjectStatusError(messageKey = "i2cat|message.project_status_error")
  {
    this.projectStatusTitleElem.innerHTML = "";
    I18N.set(this.projectStatusTitleElem, "textContent", "i2cat|title.project_status_summary");
    this.application.i18n.update(this.projectStatusTitleElem);
    this.projectStatusContentElem.innerHTML = "";

    const errorElem = document.createElement("p");
    errorElem.className = "bcf_project_status_error";
    I18N.set(errorElem, "textContent", messageKey);
    this.application.i18n.update(errorElem);
    this.projectStatusContentElem.appendChild(errorElem);

    this.openChecklistTopicButton.style.display = "none";
    this.openChecklistTopicButton.disabled = true;
    this.openChecklistTopicButton.removeAttribute("title");
    if (this.openChecklistTopicButton.i18n)
    {
      delete this.openChecklistTopicButton.i18n.title;
    }
  }

  updateOpenChecklistButton(recommendedTopic)
  {
    this.openChecklistTopicButton.style.display = "";

    if (recommendedTopic)
    {
      this.openChecklistTopicButton.disabled = false;
      I18N.set(this.openChecklistTopicButton, "textContent", "i2cat|button.open_checklist_topic");
      this.openChecklistTopicButton.removeAttribute("title");
      if (this.openChecklistTopicButton.i18n)
      {
        delete this.openChecklistTopicButton.i18n.title;
      }
    }
    else
    {
      this.openChecklistTopicButton.style.display = "none";
      this.openChecklistTopicButton.disabled = true;
      this.openChecklistTopicButton.removeAttribute("title");
      if (this.openChecklistTopicButton.i18n)
      {
        delete this.openChecklistTopicButton.i18n.title;
      }
    }
    this.application.i18n.update(this.openChecklistTopicButton);
  }

  async loadProjectStatusSummary(projectId)
  {
    const statusOutput = await this.fetchProjectStatus(projectId);
    const procedureName = this.extractProcedureName(statusOutput);
    const rawProcedureName = statusOutput?.tramit;
    const isSeguimentProjecte = this.isSeguimentProjecteProcedure(rawProcedureName || procedureName);
    
    const topics = isSeguimentProjecte ? await this.fetchProjectTopics(projectId) : [];

    const currentStatus = this.extractPhase(statusOutput);
    const currentPhase = this.extractCurrentProjectPhase(statusOutput, currentStatus);
    const checklistSummary = isSeguimentProjecte
      ? await this.buildChecklistSummary(topics, currentPhase, currentStatus)
      : null;

    const project = this.projectMap.get(projectId);
    const projectName = project?.name || projectId;

    this.projectStatusData = {
      projectId,
      projectName,
      phase: currentStatus,
      currentPhase,
      currentStatus,
      procedureName,
      isSeguimentProjecte,
      statusOutput,
      topics,
      checklistSummary,
      recommendedTopic: checklistSummary?.recommendedTopic || null,
    };

    return this.projectStatusData;
  }

  fetchProjectStatus(projectId)
  {
    if (!this.taskService)
    {
      throw new Error("Task service not available");
    }

    const taskData = {
      taskName: "check_status_projecte.js",
      input: { project_id: projectId },
      waitTime: 5000,
    };

    return new Promise((resolve, reject) =>
    {
      this.taskService.createExecutions(taskData,
        result =>
        {
          console.log("Project status result:", result);
          if (!result?.output)
          {
            reject(new Error(result?.error || "No status output was received."));
            return;
          }
          resolve(result.output);
        },
        reject,
      );
    });
  }

  fetchProjectTopics(projectId)
  {
    return new Promise((resolve, reject) =>
    {
      this.service.getTopics(projectId, "", "creation_date,index", resolve, reject);
    });
  }

  extractPhase(statusOutput)
  {
    const candidates = [
      statusOutput?.status,
      statusOutput?.project_status,
      statusOutput?.result_status?.status,
      statusOutput?.result_status,
    ];

    for (let value of candidates)
    {
      if (typeof value === "string" && value.trim().length > 0)
      {
        return value.trim();
      }
    }
    return "i2cat|message.project_status_unknown_phase";
  }
  
  extractCurrentProjectPhase(statusOutput, fallbackStatus = "")
  {
    const candidates = [
      statusOutput?.phase,
      statusOutput?.result_phase,
      statusOutput?.result_status?.project_phase,
      fallbackStatus,
    ];

    for (let value of candidates)
    {
      const mapped = this.mapPhaseValue(value);
      if (mapped)
      {
        return mapped;
      }
    }

    return {
      index: 0,
      nameKey: "i2cat|label.phase_preproject",
      name: this.application?.i18n ? this.application.i18n.get("i2cat|label.phase_preproject") : "i2cat|label.phase_preproject",
      code: "preproject",
    };
  }

  extractProcedureName(statusOutput)
  {
    const tramit = statusOutput?.tramit;

    if (typeof tramit === "string" && tramit.trim().length > 0)
    {
      const normalizedTramit = tramit.trim();
      if (this.isSeguimentProjecteProcedure(normalizedTramit))
      {
        return "Seguiment de projecte";
      }
      return normalizedTramit;
    }

    return "-";
  }

  isSeguimentProjecteProcedure(procedureName)
  {
    const normalized = this.normalizeText(procedureName)
      .replace(/[-_\s]/g, "");

    return normalized.includes("seguimentprojecte") ||
      normalized.includes("seguimentdeprojecte");
  }

  mapPhaseValue(value)
  {
    if (value === null || value === undefined)
    {
      return null;
    }

    const phaseConfigs = [
      { key: "i2cat|label.phase_preproject", code: "preproject" },
      { key: "i2cat|label.phase_basic", code: "basic" },
      { key: "i2cat|label.phase_executive", code: "executive" },
      { key: "i2cat|label.phase_finalized", code: "finalized" },
    ];

    let index = null;
    const numericValue = Number(value);

    if (Number.isFinite(numericValue))
    {
      index = (numericValue >= 1 && numericValue <= 4) ? numericValue - 1 : numericValue;
    }
    else
    {
      const text = this.normalizeText(value);
      const isFinalizedPhase =
        text.includes("fasepreparacioobra") ||
        text.includes("preparacio") ||
        text.includes("phasefinalized") ||
        text.includes("finalitz") ||
        text.includes("finaliz") ||
        text.includes("finalized");

      if (isFinalizedPhase) index = 3;
      else if (text.includes("execut")) index = 2;
      else if (text.includes("basic")) index = 1;
      else if (text.includes("ante") || text.includes("avant") || text.includes("preproject")) index = 0;
    }

    if (index === null || index < 0 || index >= phaseConfigs.length)
    {
      return null;
    }

    const phaseConfig = phaseConfigs[index];

    return {
      index,
      nameKey: phaseConfig.key,
      name: this.application?.i18n ? this.application.i18n.get(phaseConfig.key) : phaseConfig.key,
      code: phaseConfig.code,
    };
  }


  async buildChecklistSummary(topics, currentPhase, currentStatus)
  {
    const allChecklistTopics = topics.filter(topic => this.isChecklistTopic(topic));
    console.log("Current phase:", currentPhase, "Current status:", currentStatus);

    let phaseChecklistTopics = [];
    const phaseChecklistType = this.resolveChecklistTypeForPhase(currentPhase?.index ?? -1);

    if (phaseChecklistType)
    {
      phaseChecklistTopics = allChecklistTopics.filter(topic =>
        this.normalizeText(topic?.topic_type) === this.normalizeText(phaseChecklistType),
      );
    }

    if (phaseChecklistTopics.length === 0)
    {
      phaseChecklistTopics = allChecklistTopics;
    }

    const closedTopics = phaseChecklistTopics.filter(topic => this.isClosedStatus(topic.topic_status));
    const openTopics = phaseChecklistTopics.filter(topic => !this.isClosedStatus(topic.topic_status));

    const recommendedTopic =
      openTopics[openTopics.length - 1] ||
      phaseChecklistTopics[phaseChecklistTopics.length - 1] ||
      null;
    const currentChecklistProgress = await this.getChecklistProgress(recommendedTopic);

    return {
      total: phaseChecklistTopics.length,
      open: openTopics.length,
      closed: closedTopics.length,
      recommendedTopic,
      currentChecklistProgress,
      phaseChecklistTopics,
    };
  }

  resolveChecklistTypeForPhase(phaseIndex)
  {
    if (phaseIndex >= 0 && this.checklistTypes[phaseIndex])
    {
      return this.checklistTypes[phaseIndex];
    }

    for (let index = phaseIndex; index >= 0; index--)
    {
      if (this.checklistTypes[index])
      {
        return this.checklistTypes[index];
      }
    }

    return this.checklistTypes[this.checklistTypes.length - 1] || null;
  }

  async getChecklistProgress(topic)
  {
    let checkedChecks = 0;
    let totalChecksFromDescription = 0;

    try
    {
      if (topic?.description)
      {
        const properties = JSON.parse(topic.description);
        if (properties && typeof properties === "object")
        {
          for (let value of Object.values(properties))
          {
            const isBooleanValue = value === true || value === false;
            const isBooleanString = value === "true" || value === "false";
            if (isBooleanValue || isBooleanString)
            {
              totalChecksFromDescription++;
              if (value === true || value === "true")
              {
                checkedChecks++;
              }
            }
          }
        }
      }
    }
    catch (ex)
    {
    }

    const totalChecksFromTemplate = await this.getChecklistTemplateCheckboxTotal(topic?.topic_type);
    const totalChecks = totalChecksFromTemplate > 0 ? totalChecksFromTemplate : totalChecksFromDescription;

    return {
      checked: Math.min(checkedChecks, totalChecks),
      total: totalChecks,
    };
  }


  async fetchTemplateHtml(topicType)
  {
    if (!topicType) return null;

    if (this.templateCache.has(topicType))
    {
      return this.templateCache.get(topicType);
    }

    try
    {
      const processingPermitsService = this.application.services?.seguiment_projectes?.seguiment_projectes;
      const configuredChecklistPath = this.application.default_properties?.getSeguimentProjecteChecklistPath?.() || "/templates";
      const serviceBasePath = (processingPermitsService?.url || "/api/cloudfs/seguiment_projectes").replace(/\/+$/, "");

      let cleanTemplateSubpath = configuredChecklistPath.replace(/\/+$/, "");
      if (!cleanTemplateSubpath.startsWith("/")) cleanTemplateSubpath = "/" + cleanTemplateSubpath;

      const formUrl = `${serviceBasePath}${cleanTemplateSubpath}/${topicType}.html`;
      const response = await fetch(formUrl);

      if (!response.ok) return null;

      const htmlText = await response.text();
      this.templateCache.set(topicType, htmlText);
      return htmlText;
    }
    catch (ex)
    {
      console.error("Error carregant la plantilla HTML:", ex);
      return null;
    }
  }

  async getChecklistTemplateCheckboxTotal(topicType)
  {
    const htmlTemplate = await this.fetchTemplateHtml(topicType);
    if (!htmlTemplate) return 0;

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlTemplate, "text/html");
    return doc.querySelectorAll("input[type='checkbox']").length;
  }

  isChecklistTopic(topic)
  {
    const values = [topic?.title, topic?.topic_type, topic?.description, topic?.stage]
      .filter(Boolean)
      .map(value => this.normalizeText(value));

    return values.some(value =>
      value.includes("checklist") ||
      value.includes("llista") ||
      value.includes("lista") ||
      value.includes("verificacio") ||
      value.includes("verificacion")
    );
  }

  isClosedStatus(status)
  {
    const normalized = this.normalizeText(status || "");
    return normalized.includes("close") ||
      normalized.includes("done") ||
      normalized.includes("resol") ||
      normalized.includes("final") ||
      normalized.includes("tanc") ||
      normalized.includes("cerr");
  }

  normalizeText(value)
  {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }


  renderProjectStatusSummary(summary)
  {
    this.projectStatusContentElem.innerHTML = "";

    this.projectStatusTitleElem.innerHTML = "";
    delete this.projectStatusTitleElem.i18n;

    const titleTextSpan = document.createElement("span");
    I18N.set(titleTextSpan, "textContent", "i2cat|title.project_status_summary");

    const projectName = summary?.projectName;
    const projectNameSpan = document.createElement("span");
    projectNameSpan.textContent = projectName ? ` - ${projectName}` : "";

    this.projectStatusTitleElem.appendChild(titleTextSpan);
    this.projectStatusTitleElem.appendChild(projectNameSpan);

    this.application.i18n.update(titleTextSpan);

    const listElem = document.createElement("ul");
    listElem.className = "bcf-list";

    const addRow = (label, value) =>
    {
      const rowElem = document.createElement("li");
      rowElem.className = "bcf_project_status_row";

      const strongElem = document.createElement("strong");
      const labelSpan = document.createElement("span");
      if (typeof label === "string" && label.startsWith("i2cat|"))
      {
        I18N.set(labelSpan, "textContent", label);
      }
      else
      {
        labelSpan.textContent = label;
      }
      strongElem.appendChild(labelSpan);

      const colonSpan = document.createElement("span");
      colonSpan.textContent = ": ";
      strongElem.appendChild(colonSpan);

      const valueSpan = document.createElement("span");
      if (typeof value === "string" && value.startsWith("i2cat|"))
      {
        I18N.set(valueSpan, "textContent", value);
      }
      else
      {
        valueSpan.textContent = (value !== null && value !== undefined && value !== "") ? String(value) : "-";
      }

      rowElem.appendChild(strongElem);
      rowElem.appendChild(valueSpan);
      listElem.appendChild(rowElem);
    };

    const procedureName = summary?.procedureName || "-";
    const isSeguimentProjecte = summary?.isSeguimentProjecte === true;
    const currentStatus = summary.currentStatus || summary.phase || "i2cat|message.project_status_unknown_phase";

    addRow("i2cat|label.project_procedure_name", procedureName);
    
    if (isSeguimentProjecte)
    {
      const phaseKey = summary.currentPhase?.nameKey || (summary.currentPhase?.name ? null : "i2cat|message.project_status_unknown_phase");
      const phaseName = summary.currentPhase?.name;

      addRow("i2cat|label.project_phase", phaseKey || phaseName);
      addRow("i2cat|label.project_current_status", currentStatus);

      const recommendedTopic = summary.recommendedTopic;
      const checklistProgress = summary.checklistSummary?.currentChecklistProgress;

      if (recommendedTopic)
      {
        const checked = checklistProgress?.checked ?? 0;
        const total = checklistProgress?.total ?? 0;
        const progressText = `${checked} / ${total}`;
        addRow("i2cat|label.project_current_checklist_progress", progressText);
      }
      else
      {
        addRow("i2cat|label.project_checklist_recommended", "i2cat|message.project_status_no_checklist");
      }

      this.updateOpenChecklistButton(recommendedTopic);
    }
    else
    {
      addRow("i2cat|label.project_current_status", currentStatus);

      const out = summary.statusOutput || {};

      addRow("i2cat|label.project_record", out.expedient);
      addRow("i2cat|label.project_folder", out.projectFolder);
      addRow("i2cat|label.project_current_version", out.currentVersion);
      
      if (out.empresa) addRow("i2cat|label.project_company", out.empresa);
      if (out.autor) addRow("i2cat|label.project_author", out.autor);

      this.openChecklistTopicButton.style.display = "none";
      this.openChecklistTopicButton.disabled = true;
    }

    this.projectStatusContentElem.appendChild(listElem);
    this.application.i18n.updateTree(this.projectStatusContentElem);
  }
  openChecklistTopic()
  {
    const recommendedTopic = this.projectStatusData?.recommendedTopic;
    const topics = this.projectStatusData?.topics;

    if (!recommendedTopic || !Array.isArray(topics))
    {
      return;
    }

    const index = topics.findIndex(topic => topic.guid === recommendedTopic.guid);
    this.topics = topics;
    this.projectStatusPanelElem.style.display = "none";
    this.showTopic(recommendedTopic, index);
    this.tabbedPane.showTab("checklist");
  }
}
