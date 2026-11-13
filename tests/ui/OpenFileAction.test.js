import { OpenFileActionCustom } from "../../js/ui/file/OpenFileAction.js";
import { OpenFileAction } from "../../../base/ui/file/OpenFileAction.js";
import { IOManager } from "../../../../platform/io/IOManager.js";
import { MessageDialog } from "../../../../platform/ui/dialog/MessageDialog.js";

jest.mock("environment", () => ({
  Environment: { SERVER_URL: "https://server.example.test" },
}), { virtual: true });

jest.mock("../../../base/ui/file/OpenFileAction.js", () =>
{
  return {
    OpenFileAction: class
    {
      perform() {}
    },
  };
});

jest.mock("../../../../platform/ui/dialog/MessageDialog.js", () => ({
  MessageDialog: {
    create: jest.fn(() => ({
      setI18N: jest.fn().mockReturnThis(),
      show: jest.fn(),
    })),
  },
}));

describe("Given the custom open file action", () =>
{
  let action;
  let callback;
  let fileExplorer;
  let originalCreateObjectURL;
  let originalRevokeObjectURL;
  let originalFetch;

  beforeEach(() =>
  {
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    originalFetch = global.fetch;
    IOManager.formats.word = {
      extensions: ["docx"],
      icon: "word",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
    IOManager.formats.excel = {
      extensions: ["xlsx"],
      icon: "excel",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
    fileExplorer = {
      selectedEntry: { name: "report.docx" },
      application: { i18n: {} },
      open: jest.fn(openCallback => { callback = openCallback; }),
    };
    action = new OpenFileActionCustom();
    action.fileExplorer = fileExplorer;
  });

  afterEach(() =>
  {
    delete IOManager.formats.word;
    delete IOManager.formats.excel;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    global.fetch = originalFetch;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("When it opens a Word document, then it converts the file and displays a PDF preview", async () =>
  {
    jest.spyOn(IOManager, "getFormatInfo").mockReturnValue(IOManager.formats.word);
    const previewDocument = document.implementation.createHTMLDocument();
    const previewWindow = { document: previewDocument };
    const openWindow = jest.spyOn(window, "open").mockReturnValue(previewWindow);
    const createObjectURL = jest.fn(() => "blob:pdf-preview");
    const revokeObjectURL = jest.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    jest.useFakeTimers();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob(["pdf"], { type: "application/pdf" })),
    });

    action.perform();
    await callback("source-url", {
      data: "word data",
      path: "/documents/Annual report.docx",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://server.example.test/api/convert-pdf?filename=Annual%20report.docx",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": IOManager.formats.word.mimeType },
        body: expect.any(Blob),
      }));
    expect(openWindow).toHaveBeenCalledWith("", "_blank");
    expect(previewDocument.title).toBe("Annual report.docx");
    expect(previewDocument.querySelector("iframe").src).toBe("blob:pdf-preview");
    expect(previewDocument.querySelector("style").textContent).toContain("100vw");
    expect(createObjectURL).toHaveBeenCalled();

    jest.advanceTimersByTime(10000);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:pdf-preview");
  });

  test("When it opens an Excel document, then it requests single-page sheets", async () =>
  {
    jest.spyOn(IOManager, "getFormatInfo").mockReturnValue(IOManager.formats.excel);
    fileExplorer.selectedEntry.name = "report.xlsx";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob(["pdf"])),
    });
    URL.createObjectURL = jest.fn(() => "blob:preview");
    URL.revokeObjectURL = jest.fn();
    jest.spyOn(window, "open").mockReturnValue(null);

    action.perform();
    await callback("source-url", { data: "excel data", path: "/reports/report.xlsx" });

    expect(global.fetch.mock.calls[0][0]).toContain("&singlePageSheets=true");
  });

  test("When conversion fails, then it shows an error dialog", async () =>
  {
    jest.spyOn(IOManager, "getFormatInfo").mockReturnValue(IOManager.formats.word);
    const error = new Error("conversion failed");
    global.fetch = jest.fn().mockRejectedValue(error);
    const logError = jest.spyOn(console, "error").mockImplementation(() => {});

    action.perform();
    await callback("source-url", { data: "word data", path: "/report.docx" });

    expect(logError).toHaveBeenCalledWith(error);
    expect(MessageDialog.create).toHaveBeenCalledWith(
      "title.error", "S'ha produït un error en previsualitzar el document.");
  });

  test("When the selected file is not a supported office document, then it delegates to the base action", () =>
  {
    fileExplorer.selectedEntry.name = "model.ifc";
    jest.spyOn(IOManager, "getFormatInfo").mockReturnValue(null);
    const basePerform = jest.spyOn(OpenFileAction.prototype, "perform");

    action.perform();

    expect(basePerform).toHaveBeenCalled();
    expect(fileExplorer.open).not.toHaveBeenCalled();
  });
});
