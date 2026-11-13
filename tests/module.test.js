import { activate } from "../module.js";
import { IOManager } from "../../../platform/io/IOManager.js";
import { ToolManager } from "../js/utils/ToolManager.js";
import { Environment } from "environment";
import { CSSManager } from "../../../platform/ui/CSSManager.js";
import { IconManager } from "../../../platform/ui/IconManager.js";
import { BundleManager } from "../../../platform/i18n/BundleManager.js";

jest.mock("environment", () => ({
  Environment: { SERVER_URL: "https://server.example.test" },
}), { virtual: true });

jest.mock("../js/tools/NewSceneTool.js", () => ({
  NewSceneToolCustom: jest.fn().mockImplementation(() => ({ name: "new_scene_custom" })),
}));
jest.mock("../js/tools/BCFTool.js", () => ({
  BCFToolCustom: jest.fn().mockImplementation(() => ({ name: "bcf_custom" })),
}));
jest.mock("../js/tools/SeguimentProjecteTool.js", () => ({
  SeguimentProjecteTool: jest.fn().mockImplementation(() => ({ name: "project_tracking" })),
}));
jest.mock("../js/tools/UploadModelTool.js", () => ({
  UploadModelTool: jest.fn().mockImplementation(() => ({ name: "upload_model" })),
}));
jest.mock("../js/tools/SelectByViewTool.js", () => ({
  SelectByViewTool: jest.fn().mockImplementation(() => ({ name: "select_by_view" })),
}));
jest.mock("../js/tools/TaskTool.js", () => ({
  TaskTool: jest.fn().mockImplementation(() => ({ name: "task" })),
}));
jest.mock("../js/tools/ScriptTool.js", () => ({
  ScriptToolCustom: jest.fn().mockImplementation(() => ({ name: "script_custom" })),
}));
jest.mock("../js/tools/ReportTool.js", () => ({
  ReportToolCustom: jest.fn().mockImplementation(() => ({ name: "report_custom" })),
}));
jest.mock("../js/tools/GISTool.js", () => ({
  GISTool: jest.fn().mockImplementation(() => ({ name: "gis" })),
}));
jest.mock("../js/tools/ProcessingPermitsTool.js", () => ({
  ProcessingPermitsTool: jest.fn().mockImplementation(() => ({ name: "processing_permits" })),
}));
jest.mock("../js/io/TaskService.js", () => ({
  TaskService: jest.fn().mockImplementation(options => ({ options })),
}));
jest.mock("../../../platform/io/WebdavService.js", () => ({
  WebdavService: jest.fn().mockImplementation(options => ({ options })),
}));
jest.mock("../../../platform/i18n/BundleManager.js", () => ({
  BundleManager: { setBundle: jest.fn() },
}));
jest.mock("../../../platform/ui/CSSManager.js", () => ({
  CSSManager: { setCSS: jest.fn() },
}));
jest.mock("../../../platform/ui/IconManager.js", () => ({
  IconManager: { setSprite: jest.fn() },
}));
jest.mock("../js/utils/ToolManager.js", () => ({
  ToolManager: {
    replaceTool: jest.fn(),
    removeTool: jest.fn(),
    addTool: jest.fn(),
  },
}));

describe("Given the i2cat module", () =>
{
  afterEach(() =>
  {
    delete IOManager.formats.word;
    delete IOManager.formats.excel;
  });

  test("When it activates, then it configures its assets, services, formats, and tools", () =>
  {
    const application = {
      services: {
        model: { idb_models: { name: "local models" } },
        script: { idb_scripts: { name: "local scripts" } },
        report: { idb_reports: { name: "local reports" } },
      },
      removeService: jest.fn(),
      addService: jest.fn(),
      menuBar: {
        getMenu: jest.fn(() => ({
          getActionMenuItem: jest.fn(),
          getSeparator: jest.fn(),
          addSeparator: jest.fn(),
        })),
      },
      toolBar: {
        addSeparator: jest.fn(),
        removeSeparator: jest.fn(),
      },
      tools: {},
    };

    activate(application);

    expect(CSSManager.setCSS).toHaveBeenCalledWith(
      "i2cat", "./assets/css/styles.css", expect.any(Object));
    expect(IconManager.setSprite).toHaveBeenCalled();
    expect(BundleManager.setBundle).toHaveBeenCalled();
    expect(application.removeService).toHaveBeenCalledTimes(3);
    expect(application.addService).toHaveBeenCalledTimes(3);
    expect(application.addService.mock.calls.map(([, type]) => type)).toEqual([
      "task", "task_executions", "seguiment_projectes",
    ]);
    expect(IOManager.formats.word).toMatchObject({
      extensions: ["doc", "docx"],
      icon: "word",
    });
    expect(IOManager.formats.excel).toMatchObject({
      extensions: ["xls", "xlsx"],
      icon: "excel",
    });
    expect(ToolManager.replaceTool).toHaveBeenCalledTimes(3);
    expect(ToolManager.removeTool).toHaveBeenCalledWith(application, "savelocal");
    expect(ToolManager.addTool).toHaveBeenCalledTimes(8);
  });

  test("When its services exist and menus are unavailable, then it preserves them and opens available panels", () =>
  {
    const serverUrl = Environment.SERVER_URL;
    Environment.SERVER_URL = undefined;
    const saveFeaturedProperties = jest.fn();
    const application = {
      services: {
        task: {},
        task_executions: {},
        seguiment_projectes: {},
      },
      removeService: jest.fn(),
      addService: jest.fn(),
      menuBar: { getMenu: jest.fn(() => undefined) },
      toolBar: {
        addSeparator: jest.fn(),
        removeSeparator: jest.fn(),
      },
      tools: {
        outliner: { panel: {} },
        inspector: {
          execute: jest.fn(function()
          {
            this.panel.visible = true;
          }),
          panel: {
            featuredProperties: { userData: {} },
            saveFeaturedProperties,
          },
        },
      },
    };
    application.tools.outliner.execute = jest.fn(function()
    {
      this.panel.visible = true;
    });

    try
    {
      activate(application);

      expect(application.addService).not.toHaveBeenCalled();
      expect(application.removeService).not.toHaveBeenCalled();
      expect(ToolManager.removeTool).toHaveBeenCalledTimes(1);
      expect(ToolManager.removeTool).toHaveBeenCalledWith(application, "bcf");
      expect(ToolManager.replaceTool).toHaveBeenCalledTimes(1);
      expect(application.tools.outliner.execute).toHaveBeenCalledTimes(1);
      expect(application.tools.inspector.execute).toHaveBeenCalledTimes(1);
      expect(application.tools.outliner.panel.visible).toBe(true);
      expect(application.tools.inspector.panel.visible).toBe(true);
      expect(saveFeaturedProperties).toHaveBeenCalled();
    }
    finally
    {
      Environment.SERVER_URL = serverUrl;
    }
  });
});
