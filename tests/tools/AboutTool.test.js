import { AboutTool } from "../../../../modules/base/tools/AboutTool.js";
import { Dialog } from "../../../../platform/ui/dialog/Dialog.js";
import { Controls } from "../../../../platform/ui/Controls.js";
import * as THREE from "three";

jest.mock("../../../../platform/ui/Tool.js", () => ({
  Tool: class {
    constructor(application) {
      this.application = application;
    }

    setOptions(options) {
      this.options = options;
    }
  },
}));

const mockDialogInstance = {
  setSize: jest.fn(),
  setI18N: jest.fn(),
  addButton: jest.fn(),
  show: jest.fn(),
  hide: jest.fn(),
  bodyElem: document.createElement("div"),
  onShow: null,
};

jest.mock("../../../../platform/ui/dialog/Dialog.js", () => ({
  Dialog: jest.fn(() => mockDialogInstance),
}));

jest.mock("../../../../platform/ui/Controls.js", () => ({
  Controls: {
    addIcon: jest.fn(() => ({ style: {} })),
  },
}));

jest.mock("three", () => ({
  REVISION: "mock-revision-123",
}));

const createGlContext = (debugRendererInfo = null) => ({
  VERSION: "VERSION_KEY",
  VENDOR: "VENDOR_KEY",
  RENDERER: "RENDERER_KEY",
  getParameter: jest.fn((parameter) => ({
    VERSION_KEY: "WebGL 2.0 Mock",
    VENDOR_KEY: "Mock Vendor",
    RENDERER_KEY: "Mock Renderer",
    UNMASKED_RENDERER_WEBGL_KEY: "Unmasked Mock Renderer",
    UNMASKED_VENDOR_WEBGL_KEY: "Unmasked Mock Vendor",
  })[parameter]),
  getExtension: jest.fn(() => debugRendererInfo),
});

describe("AboutTool", () => {
  let mockApplication;
  let getContextSpy;
  let mockButton;
  let originalWebGLRenderingContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDialogInstance.bodyElem.innerHTML = "";
    mockDialogInstance.onShow = null;
    mockButton = { focus: jest.fn() };
    mockDialogInstance.addButton.mockReturnValue(mockButton);
    global.Controls = Controls;
    originalWebGLRenderingContext = global.WebGLRenderingContext;

    mockApplication = {
      constructor: {
        NAME: "TestApp",
        VERSION: "1.0.0",
      },
      baseUrl: "https://example.test/app/",
      renderer: {
        constructor: {
          name: "WebGLRendererMock",
        },
      },
      i18n: { get: jest.fn((key) => key) },
      loadedModules: ["ModuleA", "ModuleB"],
      addTool: jest.fn(),
    };

    getContextSpy = jest.spyOn(HTMLCanvasElement.prototype, "getContext");
  });

  afterEach(() => {
    getContextSpy.mockRestore();
    if (originalWebGLRenderingContext === undefined) {
      delete global.WebGLRenderingContext;
    } else {
      global.WebGLRenderingContext = originalWebGLRenderingContext;
    }
    delete global.Controls;
  });

  test("initializes and registers the tool with the application", () => {
    const options = { some: "option" };
    const tool = new AboutTool(mockApplication, options);

    expect(tool.name).toBe("about");
    expect(tool.label).toBe("base|tool.about.label");
    expect(tool.className).toBe("about");
    expect(tool.iconName).toBe("base|about");
    expect(tool.immediate).toBe(true);
    expect(tool.application).toBe(mockApplication);
    expect(tool.options).toBe(options);
    expect(mockApplication.addTool).toHaveBeenCalledWith(tool);
  });

  test("renders system information and the supported WebGL context details", () => {
    const debugRendererInfo = {
      UNMASKED_RENDERER_WEBGL: "UNMASKED_RENDERER_WEBGL_KEY",
      UNMASKED_VENDOR_WEBGL: "UNMASKED_VENDOR_WEBGL_KEY",
    };
    const gl = createGlContext(debugRendererInfo);
    getContextSpy.mockReturnValue(gl);
    global.WebGLRenderingContext = function WebGLRenderingContext() {};

    const tool = new AboutTool(mockApplication);
    tool.execute();

    const properties = mockDialogInstance.bodyElem.querySelector(".properties");
    const html = properties.innerHTML;

    expect(html).toContain("TestApp version");
    expect(html).toContain("1.0.0");
    expect(html).toContain("ThreeJS revision");
    expect(html).toContain(THREE.REVISION);
    expect(html).toContain("WebGLRendererMock");
    expect(html).toContain("https://example.test/app/");
    expect(html).toContain(navigator.userAgent);
    expect(html).toContain("WebGL status");
    expect(html).toContain("WebGL 2.0 Mock");
    expect(html).toContain("Mock Vendor");
    expect(html).toContain("Mock Renderer");
    expect(html).toContain("Unmasked Mock Renderer");
    expect(html).toContain("Unmasked Mock Vendor");
    expect(getContextSpy).toHaveBeenCalledWith("webgl2");
    expect(gl.getExtension).toHaveBeenCalledWith("WEBGL_debug_renderer_info");
    expect(Controls.addIcon).toHaveBeenCalledWith(
      mockDialogInstance.bodyElem.querySelector(".logo"),
      "bimrocket",
      "logo",
    );
    expect(properties.classList).toContain("overflow-auto");
    expect(document.body.querySelector("canvas")).toBeNull();
  });

  test("reports WebGL as unsupported without requesting a graphics context", () => {
    delete global.WebGLRenderingContext;

    const tool = new AboutTool(mockApplication);
    tool.execute();

    const html = mockDialogInstance.bodyElem.querySelector(".properties").innerHTML;
    expect(html).toContain("WebGL status");
    expect(html).toContain("Not supported");
    expect(getContextSpy).not.toHaveBeenCalled();
  });

  test("falls back to webgl and omits debug details when the extension is unavailable", () => {
    const gl = createGlContext();
    getContextSpy.mockImplementation((contextName) =>
      contextName === "webgl" ? gl : null,
    );
    global.WebGLRenderingContext = function WebGLRenderingContext() {};

    new AboutTool(mockApplication).execute();

    const html = mockDialogInstance.bodyElem.querySelector(".properties").innerHTML;
    expect(getContextSpy.mock.calls.map(([name]) => name)).toEqual([
      "webgl2",
      "webgl",
    ]);
    expect(html).toContain("WebGL 2.0 Mock");
    expect(html).not.toContain("Unmasked Mock Renderer");
    expect(gl.getExtension).toHaveBeenCalledWith("WEBGL_debug_renderer_info");
  });

  test("falls back to experimental-webgl when webgl2 and webgl are unavailable", () => {
    const gl = createGlContext();
    getContextSpy.mockImplementation((contextName) =>
      contextName === "experimental-webgl" ? gl : null,
    );
    global.WebGLRenderingContext = function WebGLRenderingContext() {};

    new AboutTool(mockApplication).execute();

    const html = mockDialogInstance.bodyElem.querySelector(".properties").innerHTML;
    expect(getContextSpy.mock.calls.map(([name]) => name)).toEqual([
      "webgl2",
      "webgl",
      "experimental-webgl",
    ]);
    expect(html).toContain("WebGL 2.0 Mock");
  });

  test("reports a WebGL error when all context types are unavailable", () => {
    getContextSpy.mockReturnValue(null);
    global.WebGLRenderingContext = function WebGLRenderingContext() {};

    new AboutTool(mockApplication).execute();

    const html = mockDialogInstance.bodyElem.querySelector(".properties").innerHTML;
    expect(html).toContain("WebGL status");
    expect(html).toContain("ERROR");
    expect(getContextSpy.mock.calls.map(([name]) => name)).toEqual([
      "webgl2",
      "webgl",
      "experimental-webgl",
    ]);
  });

  test("shows the accept button and focuses it when the dialog is displayed", () => {
    new AboutTool(mockApplication).execute();

    expect(Dialog).toHaveBeenCalledWith("base|tool.about.label");
    expect(mockDialogInstance.setSize).toHaveBeenCalledWith(400, 410);
    expect(mockDialogInstance.setI18N).toHaveBeenCalledWith(mockApplication.i18n);
    expect(mockDialogInstance.addButton).toHaveBeenCalledWith(
      "accept",
      "button.accept",
      expect.any(Function),
    );
    expect(mockDialogInstance.show).toHaveBeenCalled();

    mockDialogInstance.onShow();

    expect(mockButton.focus).toHaveBeenCalled();
  });

  test("hides the dialog when the accept button is clicked", () => {
    new AboutTool(mockApplication).execute();

    const onAccept = mockDialogInstance.addButton.mock.calls[0][2];
    onAccept();

    expect(mockDialogInstance.hide).toHaveBeenCalled();
  });
});
