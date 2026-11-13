/**
 * i2cat module
 *
 * @author nuriaescudei2cat
 * @author alexis-i2cat
 */

import { NewSceneToolCustom } from "./js/tools/NewSceneTool.js";
import { BCFToolCustom } from "./js/tools/BCFTool.js";
import { SeguimentProjecteTool } from "./js/tools/SeguimentProjecteTool.js";
import { UploadModelTool } from "./js/tools/UploadModelTool.js";
import { SelectByViewTool } from "./js/tools/SelectByViewTool.js";
import { TaskTool } from "./js/tools/TaskTool.js";
import { ScriptToolCustom } from "./js/tools/ScriptTool.js";
import { ReportToolCustom } from "./js/tools/ReportTool.js";
import { GISTool } from "./js/tools/GISTool.js";
import { TaskService } from "./js/io/TaskService.js";
import { ToolManager } from "./js/utils/ToolManager.js";
import { ProcessingPermitsTool } from "./js/tools/ProcessingPermitsTool.js";
import { WebdavService } from "platform/io/WebdavService.js";
import { BundleManager } from "platform/i18n/BundleManager.js";
import { CSSManager } from "platform/ui/CSSManager.js";
import { IconManager } from "platform/ui/IconManager.js";
import { Environment } from "environment";
import { IOManager } from "platform/io/IOManager.js";

const default_properties = await import(`${Environment.SERVER_URL}/api/cloudfs/scripts/default_properties.js`)
  .catch((error) => {console.warn(error.message); return null;} );
const default_psets = await import(`${Environment.SERVER_URL}/api/cloudfs/scripts/default_psets.js`)
  .catch((error) => {console.warn(error.message); return null;} );
const report_utils = await import(`${Environment.SERVER_URL}/api/cloudfs/scripts/report_utils.js`)
  .catch((error) => {console.warn(error.message); return null;} );

export function activate(application)
{
  CSSManager.setCSS("i2cat", "./assets/css/styles.css", import.meta);
  IconManager.setSprite("i2cat", "./assets/icons/misc.svg", import.meta);
  BundleManager.setBundle("i2cat", "./i18n/i2cat", import.meta);

  default_properties?.load?.(application);
  default_psets?.load?.(application);
  const defaultProperties = application.default_properties;
  const defaultPSets = application.default_psets;
  report_utils?.load?.(application);

  // avoid local storage in file explorer by removing its services
  if (application?.services?.model?.["idb_models"])
  {
    application.removeService(application.services.model["idb_models"], "model", false);
  }
  if (application?.services?.script?.["idb_scripts"])
  {
    application.removeService(application.services.script["idb_scripts"], "script", false);
  }
  if (application?.services?.report?.["idb_reports"])
  {
    application.removeService(application.services.report["idb_reports"], "report", false);
  }

  // service initialization
  if (application.services.task === undefined)
  {
    if (typeof Environment.SERVER_URL === "string")
    {
      const tasks = new WebdavService({
        name: "tasks",
        description : "Remote",
        url: Environment.SERVER_URL + "/api/cloudfs/tasks",
      });
      application.addService(tasks, "task", false);
    }
  }

  if (application.services.task_executions === undefined)
  {
    if (typeof Environment.SERVER_URL === "string")
    {
      const taskExecutions = new TaskService({
        name: "tasks",
        description : "Remote",
        url: Environment.SERVER_URL + "/api",
      });
      application.addService(taskExecutions, "task_executions", false);
    }
  }

  if (application.services.seguiment_projectes === undefined)
  {
    if (typeof Environment.SERVER_URL === "string")
    {
      const webdav = new WebdavService({
        name: "seguiment_projectes",
        description : "Remote",
        url : Environment.SERVER_URL + "/api/cloudfs/seguiment_projectes",
      });
      application.addService(webdav, "seguiment_projectes", false);
    }
  }

  // additional accepted formats
  IOManager.formats["word"] = {
    description: "Microsoft Word Document (*.doc, *.docx)",
    extensions: ["doc", "docx"],
    mimeType : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    mimeTypes: {
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
    dataType : "arraybuffer",
    icon : "word",
  };

  IOManager.formats["excel"] = {
    description : "Microsoft Excel Spreadsheet (*.xls, *.xlsx)",
    extensions : ["xls", "xlsx"],
    mimeType : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    mimeTypes: {
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
    dataType : "arraybuffer",
    icon : "excel",
  };

  // bimrocket UI
  const menuBar = application.menuBar;
  const toolBar = application.toolBar;
  toolBar.removeSeparator("bim");
  const fileMenu = menuBar.getMenu("base|menu.file");
  const editMenu = menuBar.getMenu("base|menu.edit");
  const analysisMenu = menuBar.getMenu("analysis|menu.analysis");
  const bimMenu = menuBar.getMenu("BIM");
  const gisMenu = menuBar.getMenu("gis|menu.gis");

  // upload model config.
  const getProceduresConfig = defaultProperties?.getProceduresConfig || (() => ({}));
  const {
    PROCEDURE_RULES = {},
    PROCEDURE_FOLDER_PERMISSIONS = {},
    PROJECT_FOLDER_PERMISSIONS_FOR_ACL_FILE = {},
  } = getProceduresConfig();

  // custom tools
  const newSceneToolCustom = new NewSceneToolCustom(application);
  const bcfToolCustom = new BCFToolCustom(application);
  const seguimentProjecteTool = new SeguimentProjecteTool(application);
  const uploadModelTool = new UploadModelTool(application, {
    procedureRules: PROCEDURE_RULES,
    folderPermissions: PROCEDURE_FOLDER_PERMISSIONS,
    projectPermissionsACL: PROJECT_FOLDER_PERMISSIONS_FOR_ACL_FILE,
    environment: Environment.SERVER_URL,
  });
  const selectByViewTool = new SelectByViewTool(application, {
    views: (defaultProperties?.getModelViews || (() => []))(),
  });
  const taskTool = new TaskTool(application);
  const scriptTool = new ScriptToolCustom(application);
  const reportTool = new ReportToolCustom(application);
  const gisTool = new GISTool(application);
  const processingPermitsTool = new ProcessingPermitsTool(application);

  if (fileMenu) ToolManager.replaceTool(application, "new_scene", newSceneToolCustom, {
    targetMenu: fileMenu,
    targetToolbar: toolBar,
  });

  const adminTool = application.tools.server_admin;
  const setupTool = application.tools.setup;
  if (adminTool)
  {
    ToolManager.removeTool(application, "server_admin");
    let setupIndex = undefined;
    if (setupTool)
    {
      setupIndex = ToolManager._getToolbarIndex(toolBar, setupTool);
    }
    if (setupIndex !== undefined)
    {
      ToolManager.addTool(application, adminTool, {
        targetMenu: editMenu,
        targetToolbar: toolBar, 
        toolbarIndex: setupIndex + 1 
      });
    }
  }
  
  const ifcDbTool = application.tools["ifc_db"];
  ToolManager.removeTool(application, "bcf");
  if (bimMenu) {
    if (ifcDbTool)
    {
      ToolManager.addTool(application, ifcDbTool, { targetMenu: bimMenu, targetToolbar: toolBar });
    }
    ToolManager.addTool(application, bcfToolCustom, { targetMenu: bimMenu, targetToolbar: toolBar });
  }
  if (fileMenu) ToolManager.removeTool(application, "file_explorer");
  if (editMenu) ToolManager.replaceTool(application, "script", scriptTool, { targetMenu: editMenu, targetToolbar: toolBar });
  ToolManager.replaceTool(application, "report", reportTool, { targetMenu: analysisMenu, targetToolbar: toolBar });
  if (fileMenu) ToolManager.removeTool(application, "savelocal");
  if (bimMenu) ToolManager.removeTool(application, "bim_delta");
  if (fileMenu)
  {
    const openLocalItem = fileMenu.getActionMenuItem(application.tools.openlocal);
    if (openLocalItem)
    {
      const separatorName = "filemenu-i2cat";
      fileMenu.getSeparator(separatorName)?.remove();
      fileMenu.addSeparator(separatorName, openLocalItem.getIndex() + 1);
    }
  }
  ToolManager.addTool(application, selectByViewTool, { targetMenu: analysisMenu, targetToolbar: toolBar });
  toolBar.addSeparator("bim-i2cat");
  ToolManager.addTool(application, processingPermitsTool, { targetMenu: fileMenu, targetToolbar: toolBar, menuIndex: "filemenu-i2cat" });
  ToolManager.addTool(application, uploadModelTool, { targetMenu: fileMenu, targetToolbar: toolBar, menuIndex: "filemenu-i2cat" });
  ToolManager.addTool(application, gisTool, { targetMenu: gisMenu, targetToolbar: toolBar });
  ToolManager.addTool(application, scriptTool, { targetToolbar: toolBar });
  ToolManager.addTool(application, taskTool, { targetMenu: analysisMenu, targetToolbar: toolBar });
  ToolManager.addTool(application, seguimentProjecteTool, { targetMenu: fileMenu, targetToolbar: toolBar, menuIndex: "filemenu-i2cat" });

  const sectionTool = application.tools["section"];
  const outlinerTool = application.tools.outliner;
  const inspectorTool = application.tools.inspector;
  if (sectionTool && outlinerTool)
  {
    toolBar.addSeparator("section_outliner");
    const sectionOutlinerSeparator = toolBar.scrollElem
      .querySelector("div.separator[data-name=\"section_outliner\"]");
    const outlinerButton = toolBar.getToolButton(outlinerTool)?.buttonElem;
    if (sectionOutlinerSeparator && outlinerButton?.parentElement)
    {
      outlinerButton.parentElement.insertBefore(sectionOutlinerSeparator, outlinerButton);
    }
  }

  const resetViewTool = application.tools["reset_view"];
  if (resetViewTool)
  {
    toolBar.addSeparator("report_reset_view");
    const reportResetSeparator = toolBar.scrollElem
      .querySelector("div.separator[data-name=\"report_reset_view\"]");
    const resetViewButton = toolBar.getToolButton(resetViewTool)?.buttonElem;
    if (reportResetSeparator && resetViewButton?.parentElement)
    {
      resetViewButton.parentElement.insertBefore(reportResetSeparator, resetViewButton);
    }
  }
  
  // persist panels
  if (outlinerTool)
    outlinerTool.execute();
  if (inspectorTool)
    inspectorTool.execute();
  
  // load properties defined in defaultPSets + user favorites
  if (inspectorTool?.panel)
  {
    const inspectorPanel = inspectorTool.panel;

    // Override populateFeaturedTab so that whole pSets set to true display all properties
    inspectorPanel.populateFeaturedTab = function()
    {
      this.featuredTabElem.innerHTML = "";
      if (!this.object) return;

      const featured = this.featuredProperties;
      let favListElem = document.createElement("ul");
      favListElem.className = "inspector";
      this.featuredTabElem.appendChild(favListElem);

      const populateFilteredProperties = (elem, currentObject, group, path) =>
      {
        if (!currentObject) return;

        for (let name in group)
        {
          const subPath = [...path, name];

          if (group[name] === true)
          {
            if (Object.hasOwn(currentObject, name))
            {
              const val = currentObject[name];
              if (val !== null && typeof val === "object" && !(val instanceof Array))
              {
                const subElem = this.createSection(elem, subPath);
                for (let propName in val)
                {
                  if (Object.hasOwn(val, propName) && !["GlobalId", "id"].includes(propName))
                  {
                    this.createWriteableProperty(subElem, val, [...subPath, propName], propName);
                  }
                }
              }
              else
              {
                this.createWriteableProperty(elem, currentObject, subPath, name);
              }
            }
          }
          else
          {
            if (currentObject.hasOwnProperty(name))
            {
              const subObject = currentObject[name];
              const subElem = this.createSection(elem, subPath);
              const subGroup = group[name];
              populateFilteredProperties(subElem, subObject, subGroup, subPath);
            }
          }
        }
      };

      populateFilteredProperties(favListElem, this.object, featured, []);
    };
    const defaultFavorites = defaultPSets?.getDefaultFavoritePSets
      ? defaultPSets.getDefaultFavoritePSets()
      : {};
    const identifier = defaultFavorites.identifier;
    let userFavorites = inspectorPanel.featuredProperties;
    if (!userFavorites.userData) userFavorites.userData = {};

    if (identifier)
    {
      const defaultFavoriteKeys = Object.keys(defaultFavorites.userData);
      const userFavoriteKeys = Object.keys(userFavorites.userData);

      for (const key of userFavoriteKeys)
      {
        if (!defaultFavoriteKeys.includes(key))
        {
          const propertiesGroup = userFavorites.userData[key];
          if (propertiesGroup === true)
          {
            delete userFavorites.userData[key];
          }
          else
          {
            const propertiesGroupKeys = Object.keys(propertiesGroup || {});
            let hasIdentifier = key.includes(identifier) || propertiesGroupKeys.some(propKey => propKey.includes(identifier));
            if (hasIdentifier) delete userFavorites.userData[key];
          }
        }
      }
      for (const key of defaultFavoriteKeys)
      {
        userFavorites.userData[key] = structuredClone(defaultFavorites.userData[key]);
      }
    }
    inspectorPanel.featuredProperties = userFavorites;
    inspectorPanel.saveFeaturedProperties();
  }
}
