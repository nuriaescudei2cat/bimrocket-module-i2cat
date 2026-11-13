import { UploadModelPanel } from "../../js/ui/UploadModelPanel.js";
import { Result } from "../../../../platform/io/FileService.js";
import { Toast } from "../../../../platform/ui/toast/Toast.js";
import { I18N } from "../../../../platform/i18n/I18N.js";
import { Controls } from "../../../../platform/ui/Controls.js";
import { LoginDialog } from "../../../../platform/ui/dialog/LoginDialog.js";
import { ErrorHandler } from "../../../../platform/ui/ErrorHandler.js";
import { ServerSession } from "../../../../platform/io/ServerSession.js";

global.structuredClone = global.structuredClone || ((val) => JSON.parse(JSON.stringify(val)));

jest.mock("../../../../platform/ui/panel/Panel.js", () => ({
  Panel: jest.fn().mockImplementation(function (application)
  {
    this.application = application;
    this.bodyElem = {
      appendChild: jest.fn(),
      querySelector: jest.fn(),
      style: {
        margin: "",
        display: "",
        flexDirection: "",
        alignItems: "",
        gap: "",
        height: "",
      },
    };
    this.hide = jest.fn();
    this.onHide = () => { };
  }),
}));

jest.mock("../../../../platform/i18n/I18N.js", () => ({
  I18N: {
    set: jest.fn(),
  },
}));

jest.mock("../../../../platform/ui/Controls.js", () => ({
  Controls: {
    addButton: jest.fn((parent, id, label, callback) =>
    {
      const mockBtn = {
        id: id,
        onclick: callback,
        style: {},
      };
      return mockBtn;
    }),
  },
}));

jest.mock("../../../../platform/ui/dialog/LoginDialog.js", () => ({
  LoginDialog: jest.fn(),
}));

jest.mock("../../../../platform/io/ifc/IFCSTEPExporter.js", () => ({
  IFCSTEPExporter: jest.fn().mockImplementation(() => ({
    parse: jest.fn(() => "mock-ifc-content"),
  })),
}));

jest.mock("../../../../platform/ui/ErrorHandler.js", () => ({
  ErrorHandler: {
    handleError: jest.fn(),
  },
}));

jest.mock("../../../../platform/io/ServerSession.js", () => ({
  ServerSession: {
    getSession: jest.fn().mockReturnValue({
      getUsername: jest.fn((cb) => cb("testuser")),
    }),
  },
}));

let mockReportPanelInstance;
jest.mock("../../../../modules/analysis/ui/ReportPanel.js", () => ({
  ReportPanel: jest.fn().mockImplementation(() => {
    mockReportPanelInstance = {
      visible: false,
      id: "",
      execute: jest.fn(),
      reportElem: {
        querySelectorAll: jest.fn(() => []),
        querySelector: jest.fn(() => null), 
      },
    };
    return mockReportPanelInstance;
  }),
}));

jest.mock("../../../../platform/io/FileService.js", () => ({
  Result: {
    OK: "ok",
    ERROR: "error",
  },
  ACL: jest.fn().mockImplementation(function (permissions)
  {
    this.acl = permissions;
  }),
}));

const mockToast = {
  setI18N: jest.fn(() => mockToast),
  setSize: jest.fn(() => mockToast),
  show: jest.fn(),
};
jest.mock("../../../../platform/ui/toast/Toast.js", () => ({
  Toast: {
    create: jest.fn(() => mockToast),
  },
}));

jest.mock("../../../../Environment.js", () => ({
  Environment: {
    SERVER_ALIAS: "mock_server",
  },
}));


const createMockService = () => ({
  open: jest.fn(),
  read: jest.fn(),
  save: jest.fn(),
  makeCollection: jest.fn(),
  setACL: jest.fn(),
  setCredentials: jest.fn(),
});

const createMockTaskService = () => ({
  createExecutions: jest.fn(),
});

const mockTool = { label: "Upload model" };

describe("Given the UploadModelPanel", () =>
{
  let panel;
  let mockApplication;
  let mockOptions;
  let mockModelService;
  let mockReportService;
  let mockTaskService;
  let mockModelObject;

  beforeEach(() =>
  {
    jest.clearAllMocks();

    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    global.document.getElementById = jest.fn();
    global.document.head.appendChild = jest.fn();
    global.navigator.clipboard = {
      writeText: jest.fn(() => Promise.resolve()),
    };

    mockModelService = createMockService();
    mockReportService = createMockService();
    mockTaskService = createMockTaskService();

    mockModelObject = {
      userData: {
        IFC: { GlobalId: "test-global-id$123" },
      },
    };

    mockApplication = {
      services: {
        report: { reports: mockReportService },
        model: { models: mockModelService },
        task_executions: { tasks: mockTaskService },
      },
      panelManager: {
        addPanel: jest.fn(),
        removePanel: jest.fn(),
      },
      i18n: {
        get: jest.fn((key) => key),
        update: jest.fn(),
      },
      baseObject: {
        children: [mockModelObject],
      },
      progressBar: {
        message: "",
        visible: false,
      },
      element: {
        baseURI: "http://localhost/",
      },
      useTool: jest.fn(),
    };

    mockOptions = {
      procedureRules: {
        procedures: {
          proc1: { folder: "/folder1" },
          proc2: { folder: "/folder2" },
        },
      },
      folderPermissions: {},
      projectPermissionsACL: {},
    };

    panel = new UploadModelPanel(mockApplication, mockTool, mockOptions);
    panel.modelObject = mockModelObject;
  });

  describe("When it initiates", () =>
  {
    let select;

    beforeEach(() =>
    {
      select = panel.selectProcedure;
    });

    test("Then it should create a select element with a placeholder and 2 procedures", () =>
    {
      const expectedSelectTagName = "SELECT";
      const expectedProceduresLength = 3;

      expect(select.tagName).toBe(expectedSelectTagName);
      expect(select.options.length).toBe(expectedProceduresLength);
    });

    test("Then it should set and empty value and the values 'proc1' and 'proc2' respectively", () =>
    {
      const expectedPlaceHolderValue = "";
      const expectedFirstProcedureValue = "proc1";
      const expectedSecondProcedureValue = "proc2";

      expect(select.options[0].value).toBe(expectedPlaceHolderValue);
      expect(select.options[1].value).toBe(expectedFirstProcedureValue);
      expect(select.options[2].value).toBe(expectedSecondProcedureValue);
    });

    test("Then it should set an empty text and the texts 'proc1' and 'proc2' respectively", () =>
    {
      const expectedPlaceholderText = "";
      const expectedFirstProcedureText = "proc1";
      const expectedSecondProcedureText = "proc2";

      expect(select.options[0].textContent).toBe(expectedPlaceholderText);
      expect(select.options[1].textContent).toBe(expectedFirstProcedureText);
      expect(select.options[2].textContent).toBe(expectedSecondProcedureText);
    });

    test("Then it should set the default selected procedure", () =>
    {
      const expectedDefaultProcedureValue = "";
      const expectedSelectedProcedureIndex = 0;
      const expectedSelectedProcedureValue = "";

      expect(panel.selectedProcedureKey).toBe(expectedDefaultProcedureValue);
      expect(panel.selectProcedure.selectedIndex).toBe(expectedSelectedProcedureIndex);
      expect(panel.selectProcedure.value).toBe(expectedSelectedProcedureValue);
    });

    test("Then it should update the selection when a procedure is chosen", () =>
    {
      const select = panel.selectProcedure;
      const expectedSelectedProcedureKey = "proc1";
      const expectedSelectedProcedureValue = "proc1";

      select.value = "proc1";
      select.dispatchEvent(new Event("change"));

      expect(panel.selectedProcedureKey).toBe(expectedSelectedProcedureKey);
      expect(select.value).toBe(expectedSelectedProcedureValue);
    });

    test("Then it should use a default empty function for gisConfig if default_properties is missing", () =>
    {
      const appWithoutDefaultProps = {
        ...mockApplication,
        default_properties : undefined,
      };

      const localPanel = new UploadModelPanel(appWithoutDefaultProps, mockTool, mockOptions);

      const result = localPanel.gisConfig();

      expect(result).toEqual({});
    });

    test("Then it should not add the ReportPanel to the panelManager", () =>
    {
      expect(mockApplication.panelManager.addPanel).not.toHaveBeenCalled();
    });

    test("Then the send button should be hidden", () =>
    {
      const expectedVisibility = "none";

      expect(panel.sendElem.style.display).toBe(expectedVisibility);
    });

    test("Then it should create the 'Validate' and 'Send' buttons", () =>
    {
      expect(Controls.addButton).toHaveBeenCalledWith(
        panel.bodyElem,
        "upload_model_validate",
        "i2cat|button.validate",
        expect.any(Function),
      );

      expect(Controls.addButton).toHaveBeenCalledWith(
        panel.sendElem,
        "upload_model_send",
        "button.send",
        expect.any(Function),
      );
    });

    test("Then it should create the help and message elements", () =>
    {
      expect(panel.bodyElem.appendChild).toHaveBeenCalledWith(panel.helpElem);
      expect(panel.bodyElem.appendChild).toHaveBeenCalledWith(panel.messageElem);
      expect(panel.bodyElem.appendChild).toHaveBeenCalledWith(panel.validationMessage);
    });
  });

  describe("When the 'Validate' button is clicked", () =>
  {
    test("Then it should trigger the function startValidation", () =>
    {
      const spyValidation = jest.spyOn(panel, "startValidation").mockImplementation(() => {});
      const validateCallback = Controls.addButton.mock.calls[0][3];

      validateCallback();

      expect(spyValidation).toHaveBeenCalled();

    });
  });

  describe("When the 'Send' button is clicked", () =>
  {
    test("Then it should trigger the function openFolder", () =>
    {
      const spyOpenFolder = jest.spyOn(panel, "openFolder").mockImplementation(() => {});
      const calls = Controls.addButton.mock.calls;
      const sendButtonCall = calls.find(call => call[1] === "upload_model_send");
      const sendCallback = sendButtonCall[3];

      sendCallback();

      expect(spyOpenFolder).toHaveBeenCalled();
    });
  });

  describe("When clearPanels is called", () =>
  {

    let mockPanel1;
    let mockPanel2;

    beforeEach(() =>
    {
      mockPanel1 = { id: "panel1", visible: true };
      mockPanel2 = { id: "panel2", visible: true };

      panel.generatedPanels = [mockPanel1, mockPanel2];

      panel.clearPanels();
    });

    test("Then it should hide all generated panels", () =>
    {
      expect(mockPanel1.visible).toBe(false);
      expect(mockPanel2.visible).toBe(false);
    });

    test("Then it should remove all generated panels", () =>
    {
      expect(mockApplication.panelManager.removePanel).toHaveBeenCalledWith("panel1");
      expect(mockApplication.panelManager.removePanel).toHaveBeenCalledWith("panel2");
      expect(mockApplication.panelManager.removePanel).toHaveBeenCalledTimes(2);
    });

    test("Then the internal array of panels should be empty", () =>
    {
      expect(panel.generatedPanels).toEqual([]);
    });

    test("Then it should clear the array even if the function removePanel is undefined", () =>
    {
      const mockPanel = {
        id: "panel1",
        visible: true,
      };
      panel.generatedPanels = [mockPanel];

      mockApplication.panelManager.removePanel = undefined;

      panel.clearPanels();

      expect(panel.generatedPanels).toEqual([]);
      expect(mockPanel.visible).toBe(false);

    });
  });

  describe("When the select field value is 'proc2'", () =>
  {
    test("Then the selected procedure value should be 'proc2'", () =>
    {
      const newSelectValue = "proc2";
      const expectedSelectValue = "proc2";

      const select = panel.selectProcedure;

      select.value = newSelectValue;
      select.dispatchEvent(new Event("change"));

      expect(panel.selectedProcedureKey).toBe(expectedSelectValue);
    });
  }),

  describe("When startValidation is called", () =>
  {
    test("Then it should show an error if any model is loaded", () =>
    {
      const expectedI18NReference = "i2cat|tool.upload_model.validation_model_error";

      panel.selectedProcedureKey = "proc1";
      panel.modelObject = null;
      mockApplication.baseObject.children = [];

      const handleErrorSpy = jest.spyOn(panel, "handleError").mockImplementation(() => {});

      panel.startValidation();

      expect(handleErrorSpy).toHaveBeenCalledWith(
        expect.any(Error),
        false,
        expect.any(Function)
      );
      expect(handleErrorSpy.mock.calls[0][0].message).toBe(expectedI18NReference);
    });

    test("Then it should call 'loadReport' if a model is loaded", () =>
    {
      panel.selectedProcedureKey = "proc1";
      const loadReportSpy = jest.spyOn(panel, "loadReport");

      loadReportSpy.mockImplementation(() => Promise.resolve());
      panel.startValidation();

      expect(loadReportSpy).toHaveBeenCalled();
    });
  });

  describe("When loadReport is called", () =>
  {
    test("Then it should show an error if any procedure is selected", async () =>
    {
      const expectedI18NReference = "i2cat|tool.upload_model.validation_rule_error";

      panel.selectedProcedureKey = "";
      const handleErrorSpy = jest.spyOn(panel, "handleError").mockImplementation(() => {});

      await panel.loadReport();

      expect(handleErrorSpy).toHaveBeenCalledWith(
        expect.any(Error),
        false,
        null
      );
      expect(handleErrorSpy.mock.calls[0][0].message).toBe(expectedI18NReference);
      expect(mockReportService.open).not.toHaveBeenCalled();
    });

    // test("Then it should show an error and disable send if the validation service fails", async () =>
    // {
    //   const errorMessage = "Service Failed";
    //   const expectedVisibility = "none";

    //   panel.selectedProcedureKey = "proc1";

    //   panel.proceduresMap = {
    //     "proc1": {
    //       name: "Test Procedure",
    //       folder: "/folder1",
    //       general_rules: {
    //         folder: "",
    //         rules: ["test-rule.brs"],
    //       },
    //     },
    //   };

    //   jest.spyOn(panel, "procedureSelect").mockResolvedValue(true);
    //   jest.spyOn(panel, "layersLoad").mockResolvedValue(true);
    //   const handleErrorSpy = jest.spyOn(panel, "handleError").mockImplementation(() => {});

    //   mockReportService.open.mockImplementation((_rule, _onSuccess, _onProgress, onError) =>
    //   {
    //     onError({ message: errorMessage });
    //   });

    //   await panel.loadReport();

    //   expect(mockReportService.open).toHaveBeenCalled();
    //   expect(handleErrorSpy).toHaveBeenCalled();
    //   expect(panel.sendElem.style.display).toBe(expectedVisibility);
    // });

    // test("Then it should show an error if the validation service returns an status error", async () =>
    // {
    //   const errorMessage = "Status Error";
    //   const expectedVisibility = ""; 

    //   panel.selectedProcedureKey = "proc1";

    //   panel.proceduresMap = {
    //     "proc1": {
    //       name: "Test Procedure",
    //       folder: "/folder1",
    //       general_rules: {
    //         rules: ["test-rule.brs"],
    //       },
    //     },
    //   };

    //   jest.spyOn(panel, "procedureSelect").mockResolvedValue(true);
    //   jest.spyOn(panel, "layersLoad").mockResolvedValue(true);
    //   const handleErrorSpy = jest.spyOn(panel, "handleError").mockImplementation(() => {});

    //   mockReportService.open.mockImplementation((_rule, onSuccess) =>
    //   {
    //     onSuccess({ status: Result.ERROR, message: errorMessage });
    //   });

    //   await panel.loadReport();

    //   expect(handleErrorSpy).toHaveBeenCalled();
    //   expect(panel.sendElem.style.display).toBe(expectedVisibility);
    // });

    // test("Then it should call validateModel if the validation service succeeds", async () =>
    // {
    //   const data = "report-data";
    //   const mockReportData = { data };

    //   const folderName = "/folder1";
    //   const ruleName = "test-rule.brs";

    //   const expectedFullRulePath = `${folderName}/${ruleName}`;

    //   panel.selectedProcedureKey = "proc1";

    //   panel.proceduresMap = {
    //     "proc1": {
    //       name: "Test Procedure",
    //       folder: folderName,
    //       general_rules: {
    //         rules: [ruleName],
    //       },
    //     },
    //   };

    //   jest.spyOn(panel, "procedureSelect").mockResolvedValue(true);
    //   jest.spyOn(panel, "layersLoad").mockResolvedValue(true);

    //   mockReportService.open.mockImplementation((_rule, onSuccess) =>
    //   {
    //     onSuccess({ status: Result.OK, data: mockReportData });
    //   });

    //   const validateModelSpy = jest.spyOn(panel, "validateModel")
    //     .mockReturnValue({ hasError: false, warningItemsCount: 0 });
    //   await panel.loadReport();

    //   expect(validateModelSpy).toHaveBeenCalledWith(mockReportData, expectedFullRulePath);
    // });

    test("Then it should show an error if the procedure has no rule", () =>
    {
      const expectedErrorMessage = "i2cat|tool.upload_model.validation_rule_error";

      mockOptions.procedureRules.proc1 = { name: "Procedure 1", folder: "/folder1" };
      panel = new UploadModelPanel(mockApplication, mockTool, mockOptions);
      panel.credentials = { username: "user", password: "pw" };
      panel.selectedProcedure = "proc1";

      const handleErrorSpy = jest.spyOn(panel, "handleError").mockImplementation(() => {});

      panel.loadReport();

      expect(handleErrorSpy).toHaveBeenCalled();
      expect(handleErrorSpy.mock.calls[0][0].message).toBe(expectedErrorMessage);
      expect(mockReportService.open).not.toHaveBeenCalled();
    });
  });

  // describe("When loadReport receives a progress message", () =>
  // {
  //   test("Then it should not call handleError or showError", async () =>
  //   {
  //     const progressMessage = { progress: 50, message: "Downloading..." };
  //     const handleErrorSpy = jest.spyOn(panel, "handleError").mockImplementation(() => {});
  //     const setProgressSpy = jest.spyOn(panel, "setProgress");

  //     panel.selectedProcedureKey = "proc1";

  //     panel.proceduresMap = {
  //       "proc1": {
  //         name: "Test Procedure",
  //         folder: "/folder1",
  //         general_rules: {
  //           rules: ["test-rule.brs"],
  //         },
  //       },
  //     };

  //     jest.spyOn(panel, "procedureSelect").mockResolvedValue(true);
  //     jest.spyOn(panel, "layersLoad").mockResolvedValue(true);
  //     jest.spyOn(panel, "validateModel").mockReturnValue({ hasError: false, warningItemsCount: 0 });

  //     mockReportService.open.mockImplementation((_rule, onSuccess, onProgress) =>
  //     {
  //       onProgress(progressMessage);
  //       onSuccess({ status: "ok", data: {} });
  //     });

  //     await panel.loadReport();

  //     expect(handleErrorSpy).not.toHaveBeenCalled();
  //     expect(setProgressSpy).toHaveBeenCalledWith(50, "Downloading...");
  //   });
  // });

  // test("Then it should use the default error message 'Error al obtener informe'", async () =>
  // {
  //   jest.spyOn(panel, "ensureProcedureSelected").mockReturnValue(true);
  //   jest.spyOn(panel, "procedureSelect").mockResolvedValue(true);
  //   jest.spyOn(panel, "layersLoad").mockResolvedValue(true);
  //   const handleErrorSpy = jest.spyOn(panel, "handleError").mockImplementation(() => {});

  //   panel.selectedProcedureKey = "proc1";

  //   panel.proceduresMap = {
  //     proc1:
  //     {
  //       general_rules: {
  //         rules: ["r1"],
  //       },
  //     },
  //   };

  //   jest.spyOn(panel, "fetchReportData").mockResolvedValue({
  //     status: "ERROR",
  //     message: undefined,
  //     data: null,
  //   });

  //   await panel.loadReport();

  //   expect(handleErrorSpy).toHaveBeenCalledWith(
  //     expect.any(Error),
  //     false,
  //     null
  //   );
  //   expect(handleErrorSpy.mock.calls[0][0].message).toBe("Error al obtener informe");
  // });

  // describe("When loadReport finds 5 warnings but no errors", () =>
  // {
  //   test("Then it should show a success message with 5 warning count and enable send controls", async () =>
  //   {
  //     jest.spyOn(panel, "ensureProcedureSelected").mockReturnValue(true);
  //     jest.spyOn(panel, "fetchReportData").mockResolvedValue({ status: "OK", data: {} });
  //     const showMessageSpy = jest.spyOn(panel, "showMessage");
  //     const enableSendControlsSpy = jest.spyOn(panel, "enableSendControls");

  //     panel.selectedProcedureKey = "proc1";

  //     panel.proceduresMap = {
  //       proc1: {
  //         general_rules: {
  //           rules: ["r1"],
  //         },
  //       },
  //     };

  //     jest.spyOn(panel, "validateModel").mockReturnValue({
  //       hasError: false,
  //       warningItemsCount: 5,
  //     });

  //     await panel.loadReport();

  //     expect(showMessageSpy).toHaveBeenCalledWith("i2cat|tool.upload_model.validation_warning_success", 5);
  //     expect(enableSendControlsSpy).toHaveBeenCalledWith(true);
  //   });
  // });

  // describe("When loadReport finds validation errors in the model", () =>
  // {
  //   test("Then it should show an error and disable send controls", async () =>
  //   {
  //     jest.spyOn(panel, "ensureProcedureSelected").mockReturnValue(true);
  //     jest.spyOn(panel, "fetchReportData").mockResolvedValue({ status: "OK", data: {} });
  //     const handleErrorSpy = jest.spyOn(panel, "handleError").mockImplementation(() => {});
  //     const enableSendControlsSpy = jest.spyOn(panel, "enableSendControls");

  //     panel.selectedProcedureKey = "proc1";

  //     panel.proceduresMap = {
  //       proc1: {
  //         general_rules: {
  //           rules: ["r1"],
  //         },
  //       },
  //     };

  //     jest.spyOn(panel, "validateModel").mockReturnValue({
  //       hasError: true,
  //       warningItemsCount: 0,
  //     });

  //     await panel.loadReport();

  //     expect(handleErrorSpy).toHaveBeenCalled();
  //     expect(handleErrorSpy.mock.calls[0][0].message).toBe("i2cat|tool.upload_model.validation_output_error");
  //     expect(enableSendControlsSpy).toHaveBeenCalledWith(false);
  //   });
  // });

  // describe("When an exception occurs inside loadReport", () =>
  // {
  //   test("Then it should pass a retry callback to handleError that calls loadReport again", async () =>
  //   {
  //     jest.spyOn(panel, "ensureProcedureSelected").mockReturnValue(true);

  //     panel.selectedProcedureKey = "proc1";

  //     panel.proceduresMap = {
  //       proc1: {
  //         general_rules: {
  //           rules: ["r1"],
  //         },
  //       },
  //     };

  //     jest.spyOn(panel, "fetchReportData").mockRejectedValue(new Error("Network fail"));

  //     const handleErrorSpy = jest.spyOn(panel, "handleError").mockImplementation(() => {});
  //     await panel.loadReport();

  //     const retryCallback = handleErrorSpy.mock.calls[0][1];

  //     expect(typeof retryCallback).toBe("function");

  //     const loadReportSpy = jest.spyOn(panel, "loadReport");

  //     retryCallback();

  //     expect(loadReportSpy).toHaveBeenCalled();
  //   });
  // });

  describe("When procedureSelect is called and the selector and option exist", () =>
  {
    let proceduresUpdateSpy;
    let result;
    const tramitKey = "tramit_1";
    let mockTramitsSelector;

    beforeEach(async () =>
    {
      proceduresUpdateSpy = jest.spyOn(panel, "proceduresUpdate").mockResolvedValue();

      mockTramitsSelector = {
        options: [
          {
            value: "placeholder",
          },
          {
            value: tramitKey,
          },
        ],
        selectedIndex: 0,
        dispatchEvent: jest.fn(),
      };
      global.document.getElementById = jest.fn().mockReturnValue(mockTramitsSelector);

      result = await panel.procedureSelect(tramitKey);
    });

    test("Then it should activate the GIS tool", () =>
    {
      expect(mockApplication.useTool).toHaveBeenCalledWith("gis");
    });

    test("Then it shuold update the DOM selector index to the correct option", () =>
    {
      expect(mockTramitsSelector.selectedIndex).toBe(1);
    });

    test("Then it should dispatch a 'change' event to notify the application", () =>
    {
      expect(mockTramitsSelector.dispatchEvent).toHaveBeenCalledWith(expect.any(Event));
    });

    test("Then it should trigger the procedures update method", () =>
    {
      expect(proceduresUpdateSpy).toHaveBeenCalled();
    });

    test("Then it should return true", () =>
    {
      expect(result).toBe(true);
    });
  });

  describe("When procedureSelect is called and the selector 'tramits' is not found", () =>
  {
    let result;

    beforeEach(async () =>
    {
      global.document.getElementById = jest.fn().mockReturnValue(null);
      result = await panel.procedureSelect("any_key");
    });

    test("Then it should return false", () =>
    {
      expect(result).toBe(false);
    });
  });

  describe("When procedureSelect is called and the option key is not found within the selector", () =>
  {
    let result;

    beforeEach(async () =>
    {
      const mockTramitsSelector = {
        options: [{ value: "placeholder" }, { value: "other_key" }],
        selectedIndex: 0,
      };
      global.document.getElementById = jest.fn().mockReturnValue(mockTramitsSelector);

      result = await panel.procedureSelect("missing_key");
    });

    test("Then it should return false", () =>
    {
      expect(result).toBe(false);
    });
  });

  describe("When procedureSelect is called and an error occurs during its execution", () =>
  {
    let consoleErrorSpy;
    let result;

    beforeEach(async () =>
    {
      consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      mockApplication.useTool.mockImplementation(() => { throw new Error("Crash!"); });
      result = await panel.procedureSelect("tramit_1");
    });

    test("Then it should catch the error and log 'Error configurant tràmits'", () =>
    {
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Error configurant tràmits"), expect.any(Error));
    });

    test("Then it should return false", () =>
    {
      expect(result).toBe(false);
    });
  });

  describe("When proceduresUpdate is called and the update button exists", () =>
  {
    let mockButton;
    let result;

    beforeEach(async () =>
    {
      mockButton = { click: jest.fn() };
      global.document.querySelector = jest.fn().mockReturnValue(mockButton);

      result = await panel.proceduresUpdate();
    });

    test("Then it should look for the specific button in the DOM", () =>
    {
      expect(global.document.querySelector).toHaveBeenCalledWith("button[name='gis_update_layers']");
    });

    test("Then it should click the button", () =>
    {
      expect(mockButton.click).toHaveBeenCalled();
    });

    test("Then it should return true", () =>
    {
      expect(result).toBe(true);
    });
  });

  describe("When proceduresUpdate is called and the update button is not found", () =>
  {
    let result;

    beforeEach(async () =>
    {
      global.document.querySelector = jest.fn().mockReturnValue(null);

      result = await panel.proceduresUpdate();
    });

    test("Then it should return false", () =>
    {
      expect(result).toBe(false);
    });
  });

  describe("When proceduresUpdate is called and an error occurs during its execution", () =>
  {
    let consoleErrorSpy;
    let result;

    beforeEach(async () =>
    {
      consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      global.document.querySelector = jest.fn().mockImplementation(() =>
      {
        throw new Error("DOM Error");
      });

      result = await panel.proceduresUpdate();
    });

    test("Then it should log the error to the console", () =>
    {
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Error actualitzant capes GIS"), expect.any(Error));
    });

    test("Then it should return false", () =>
    {
      expect(result).toBe(false);
    });
  });

  describe("When layersLoad is called with an invalid or empty configuration", () =>
  {
    let result;

    beforeEach(async () =>
    {
      panel.gisConfig = jest.fn().mockReturnValue(null);

      result = await panel.layersLoad("tramit_invalid");
    });

    test("Then it should return false", () =>
    {
      expect(result).toBe(false);
    });
  });

  describe("When layersLoad is called with a valid configuration and layers to activate", () =>
  {
    let result;
    let layerActivateSpy;
    let showProgressBarSpy;

    beforeEach(async () =>
    {
      jest.spyOn(global, "setTimeout").mockImplementation((cb) => cb());

      const mockConfig = {
        name: "Config Test",
        layers: [
          {
            name: "Categoria 1",
            children: [
              { name: "Capa A", report: true, bufferSize: 5000 },
              { name: "Capa B", report: false },
            ],
          },
        ],
      };
      panel.gisConfig = jest.fn().mockReturnValue(mockConfig);
      layerActivateSpy = jest.spyOn(panel, "layerActivate").mockResolvedValue(true);
      showProgressBarSpy = jest.spyOn(panel, "showProgressBar").mockImplementation(() => {});
      jest.spyOn(console, "log").mockImplementation(() => {});

      result = await panel.layersLoad("tramit_valid");
    });

    afterEach(() =>
    {
      jest.restoreAllMocks();
    });

    test("Then it should retrieve the configuration for the specific tramit ID", () =>
    {
      expect(panel.gisConfig).toHaveBeenCalledWith("tramit_valid");
    });

    test("Then it should show the progress bar for the active layer", () =>
    {
      expect(showProgressBarSpy).toHaveBeenCalledWith(expect.stringContaining("Initializing layer loading"));
      expect(showProgressBarSpy).toHaveBeenCalledWith(expect.stringContaining("Loading layer Capa A"));
    });

    test("Then it should call layerActivate only for layers with report=true", () =>
    {
      expect(layerActivateSpy).toHaveBeenCalledWith("Capa A");
      expect(layerActivateSpy).not.toHaveBeenCalledWith("Capa B");
    });

    test("Then it should return true because at least one layer was activated", () =>
    {
      expect(result).toBe(true);
    });
  });

  describe("When layersLoad is called and an unexpected error occurs", () =>
  {
    let consoleErrorSpy;
    let result;

    beforeEach(async () =>
    {
      consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      panel.gisConfig = jest.fn().mockImplementation(() =>
      {
        throw new Error("Config Error");
      });

      result = await panel.layersLoad("tramit_error");
    });

    test("Then it should log 'Error activant capes per tràmit' to the console", () =>
    {
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Error activant capes per tràmit"), expect.any(Error));
    });

    test("Then it should return false", () =>
    {
      expect(result).toBe(false);
    });
  });

  describe("When layerActivate is called and the corresponding checkbox exists", () =>
  {
    let mockCheckbox;
    let result;
    const layerName = "test_layer";

    beforeEach(async () =>
    {
      jest.spyOn(console, "log").mockImplementation(() => {});

      mockCheckbox = {
        checked: false,
        dispatchEvent: jest.fn(),
      };

      global.document.querySelector = jest.fn().mockReturnValue(mockCheckbox);

      result = await panel.layerActivate(layerName);
    });

    test("Then it should search for the checkbox input with the correct name attribute", () =>
    {
      expect(global.document.querySelector).toHaveBeenCalledWith(`input[type="checkbox"][name="${layerName}"]`);
    });

    test("Then it should set the checkbox state to checked", () =>
    {
      expect(mockCheckbox.checked).toBe(true);
    });

    test("Then it should dispatch a 'change' event to update the viewer", () =>
    {
      expect(mockCheckbox.dispatchEvent).toHaveBeenCalledWith(expect.any(Event));
    });

    test("Then it should return true", () =>
    {
      expect(result).toBe(true);
    });
  });

  describe("When layerActivate is called and the checkbox is NOT found", () =>
  {
    let result;

    beforeEach(async () =>
    {
      jest.spyOn(console, "log").mockImplementation(() => {});
      global.document.querySelector = jest.fn().mockReturnValue(null);

      result = await panel.layerActivate("missing_layer");
    });

    test("Then it should not crash and simply return true", () =>
    {
      expect(result).toBe(true);
    });
  });

  // describe("When validateModel is called", () =>
  // {
  //   test("Then it should identify an error if the report contains one", () =>
  //   {
  //     const mockErrorNode = { tagName: "DIV", className: "error" };
  //     const mockQuerySelector = jest.fn((selector) =>
  //     {
  //       if (selector === ".error") return mockErrorNode;
  //       return null;
  //     });

  //     const mockQuerySelectorAll = jest.fn(() => []);
  //     const { ReportPanel } = require("./ReportPanel.js");

  //     ReportPanel.mockImplementation(() => ({
  //       id: "mock-id",
  //       visible: false,
  //       execute: jest.fn(),
  //       reportElem: {
  //         querySelectorAll: mockQuerySelectorAll,
  //         querySelector: mockQuerySelector ,
  //       },
  //     }));

  //     const result = panel.validateModel("source-data", "test-rule");

  //     expect(result.hasError).toBe(mockErrorNode);
  //   });

  //   test("Then it should return a clean result if the report doesn't contain any error", () =>
  //   {
  //     const mockQuerySelectorAll = jest.fn(() => []);
  //     const mockQuerySelector = jest.fn(() => null);
  //     const { ReportPanel } = require("./ReportPanel.js");

  //     ReportPanel.mockImplementation(() => ({
  //       id: "mock-id",
  //       visible: false,
  //       execute: jest.fn(),
  //       reportElem: {
  //         querySelectorAll: mockQuerySelectorAll,
  //         querySelector: mockQuerySelector,
  //       },
  //     }));

  //     const result = panel.validateModel("source-data", "test-rule");

  //     expect(result.hasError).toBeNull();
  //     expect(result.warningItemsCount).toBe(0);
  //   });

  //   test("Then it should detect warnings and return the correct count without errors", () =>
  //   {
  //     const warningCount = 3;

  //     const mockQuerySelectorAll = jest.fn((selector) =>
  //     {
  //       if (selector === ".error") return [];
  //       if (selector === ".warn:not(.collapsed)")
  //       {
  //         return Array.from({ length: warningCount }, () => ({
  //           textContent: "Generic Warning",
  //           querySelector: jest.fn(() => null),
  //         }));
  //       }
  //       return [];
  //     });
  //     const mockQuerySelector = jest.fn(() => null);
  //     const { ReportPanel } = require("./ReportPanel.js");

  //     ReportPanel.mockImplementation(() => ({
  //       id: "mock-id",
  //       visible: false,
  //       execute: jest.fn(),
  //       reportElem: {
  //         querySelectorAll: mockQuerySelectorAll,
  //         querySelector: mockQuerySelector,
  //       },
  //     }));
  //     const result = panel.validateModel("source-data", "test-rule");

  //     expect(result.warningItemsCount).toBe(warningCount);
  //     expect(result.hasError).toBeNull();
  //   });
  // });

  describe("When openFolder is called", () =>
  {
    let ensureProcedureSelectedSpy;
    let getProjectDataSpy;
    let saveAndUploadSpy;

    beforeEach(() =>
    {
      getProjectDataSpy = jest.spyOn(panel, "getProjectData").mockImplementation(() => {});
      saveAndUploadSpy = jest.spyOn(panel, "saveAndUpload").mockImplementation(() => {});

      ensureProcedureSelectedSpy = jest.spyOn(panel, "ensureProcedureSelected");
    });

    test("Then it should stop execution if no procedure is selected", () =>
    {
      ensureProcedureSelectedSpy.mockReturnValue(false);

      panel.openFolder();

      expect(getProjectDataSpy).not.toHaveBeenCalled();
      expect(saveAndUploadSpy).not.toHaveBeenCalled();
    });

    test("Then it should retrieve project data and start the upload process if a procedure is selected", () =>
    {
      ensureProcedureSelectedSpy.mockReturnValue(true);

      panel.openFolder();

      expect(getProjectDataSpy).toHaveBeenCalled();
      expect(saveAndUploadSpy).toHaveBeenCalled();
    });
  });

  describe("When saveAndUpload detects a project assigned to another procedure", () =>
  {
    test("Then it should show a disclaimer and stop the upload", async () =>
    {
      panel.selectedProcedureKey = "proc1";
      panel.getProjectData();

      mockModelService.read.mockImplementation((path, cb) => cb({ status: Result.ERROR, error: { code: 4 } }));
      mockTaskService.createExecutions.mockImplementationOnce((taskData, cb) =>
        cb({ output: { tramit: "proc2", status: "UTmanagement" } }));

      const handleErrorSpy = jest.spyOn(panel, "handleError").mockImplementation(() => {});

      await panel.saveAndUpload();

      expect(handleErrorSpy).toHaveBeenCalledWith(expect.any(Error), false, null);
      expect(mockModelService.makeCollection).not.toHaveBeenCalled();
      expect(mockModelService.save).not.toHaveBeenCalled();
      expect(mockApplication.progressBar.visible).toBe(false);
    });
  });

  describe("When createFolderStructure is called with username permissions", () =>
  {
    test("Then it should replace 'username' key with the actual user", async () =>
    {
      const username = "testuser";
      mockOptions.procedureRules = {
        procedures: {
          proc1: {
            folder: "/folder1",
            permissions: { "username": "fullcontrol" },
          },
        },
      };

      panel = new UploadModelPanel(mockApplication, mockTool, mockOptions);
      panel.modelObject = mockModelObject;

      panel.selectedProcedureKey = "proc1";

      panel.getProjectData();

      mockModelService.makeCollection.mockImplementation((path, cb) => cb({ status: Result.OK }));
      mockModelService.setACL.mockImplementation((path, acl, cb) => cb({ status: Result.OK }));

      await panel.createFolderStructure(mockModelService);

      const expectedPermissions = { [username]: "fullcontrol" };

      expect(mockApplication.services.model.models.setACL).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ acl: expectedPermissions }),
        expect.any(Function),
      );
    });
  });

  describe("When createFolderStructure fails", () =>
  {
    beforeEach(() =>
    {
      panel.selectedProcedureKey = "proc1";
      panel.getProjectData();
    });

    test("Then it should show an error if makeCollection fails", async () =>
    {
      const errorMessage = "Cannot create folder";

      mockModelService.makeCollection.mockImplementation((path, callback) =>
      {
        callback({ status: Result.ERROR, error: { message: errorMessage } });
      });

      const handleErrorSpy = jest.spyOn(panel, "handleError").mockImplementation(() => {});

      const creationPromise = panel.createFolderStructure(mockModelService);
      await Promise.resolve();

      expect(handleErrorSpy).toHaveBeenCalled();

      await Promise.race([
        creationPromise,
        Promise.resolve(),
      ]);
    });

    test("Then it should show an error if setACL fails", async () =>
    {
      const errorMessage = "ACL Error";

      mockOptions.procedureRules = {
        procedures: {
          proc1: {
            folder: "/folder1",
            permissions: { "group": "read" },
          },
        },
      };
      panel = new UploadModelPanel(mockApplication, mockTool, mockOptions);
      panel.modelObject = mockModelObject;
      panel.selectedProcedureKey = "proc1";
      panel.getProjectData();

      mockModelService.makeCollection.mockImplementation((path, cb) => cb({ status: Result.OK }));

      mockModelService.setACL.mockImplementation((path, acl, callback) =>
      {
        callback({ status: Result.ERROR, error: { message: errorMessage } });
      });

      const handleErrorSpy = jest.spyOn(panel, "handleError").mockImplementation(() => {});

      const creationPromise = panel.createFolderStructure(mockModelService);
      await Promise.resolve();

      expect(handleErrorSpy).toHaveBeenCalled();

      await Promise.race([
        creationPromise,
        Promise.resolve(),
      ]);
    });
  });

  describe("When onShow is called", () =>
  {
    test("Then it should focus the select field", () =>
    {
      const mockField = { focus: jest.fn() };
      panel.selectProcedure = mockField;

      panel.onShow();

      expect(mockField.focus).toHaveBeenCalled();
    });

    test("Then it should hide the panel if focusing fails", async () =>
    {
      const spyHide = jest.spyOn(panel, "hide");

      const mockField = {
        focus: jest.fn().mockImplementation(() =>
        {
          throw new Error("Focus Error");
        }),
      };

      panel.selectProcedure = mockField;

      panel.onShow();

      expect(spyHide).toHaveBeenCalled();
    });
  });

  describe("When a path message is shown", () =>
  {
    const textToCopy = "http://path.to/copy";

    beforeEach(() =>
    {
      panel.showPathMessage("test.key", textToCopy);
    });

    test("Then it should copy text to clipboard when clicked", async () =>
    {
      const expectedToastMessage = "i2cat|message.upload_model.path_copied";

      panel.messageElem.onclick();

      await Promise.resolve();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(textToCopy);
      expect(Toast.create).toHaveBeenCalledWith(expectedToastMessage);
    });

    test("Then it should not show a toast if copying fails", async () =>
    {
      navigator.clipboard.writeText.mockRejectedValue(new Error("Copy failed"));

      panel.messageElem.onclick();
      await Promise.resolve();

      expect(Toast.create).not.toHaveBeenCalled();
    });
  });

  describe("When injectCopyStyle is called", () =>
  {
    test("Then it should only append the style element once", () =>
    {
      panel.injectCopyStyle();

      document.getElementById.mockReturnValue(true);
      panel.injectCopyStyle();

      expect(document.head.appendChild).toHaveBeenCalledTimes(1);
    });
  });
});