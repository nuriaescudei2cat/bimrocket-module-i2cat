import { FileExplorerEnhanced } from "../../js/ui/file/FileExplorerEnhanced.js";
import { FileExplorer } from "../../../../platform/ui/file/FileExplorer.js";
import { OpenFileAction } from "../../../base/ui/file/OpenFileAction.js";
import { CompareModelAction } from "../../../../modules/bim/ui/file/CompareModelAction.js";
import { SaveSnapshotAction } from "../../../../modules/bim/ui/file/SaveSnapshotAction.js";
import { OpenFileActionCustom } from "../../js/ui/file/OpenFileAction.js";
import { UploadFolderAction } from "../../js/ui/file/UploadFolderAction.js";
import { DeleteProjectDirectoryAction } from "../../js/ui/file/DeleteProjectDirectoryAction.js";
import { Toast } from "../../../../platform/ui/toast/Toast.js";
import { Result } from "../../../../platform/io/FileService.js";
import { IOManager } from "../../../../platform/io/IOManager.js";

jest.mock("environment", () => ({
  Environment: { SERVER_URL: "https://server.example.test" },
}), { virtual: true });

jest.mock("../../../../platform/ui/file/FileExplorer.js", () =>
{
  class MockFileExplorer
  {
    constructor(application)
    {
      this.application = application;
      this.deltaPanel = {};
      const menuItems = [];
      const deleteItem = {
        name: "action.delete",
        remove: jest.fn(() => menuItems.splice(menuItems.indexOf(deleteItem), 1)),
      };
      const firstOpenItem = { action: new (require("../../../../modules/base/ui/file/OpenFileAction.js").OpenFileAction)() };
      const secondOpenItem = { action: new (require("../../../../modules/base/ui/file/OpenFileAction.js").OpenFileAction)() };
      menuItems.push(deleteItem, firstOpenItem, secondOpenItem);
      this.contextMenu = {
        menuItems,
        getMenuItem: jest.fn(label =>
          label === "action.delete" ? deleteItem : undefined),
        addMenuItem: jest.fn(function(item)
        {
          this.menuItems.push(item);
        }),
        removeMenuItem: jest.fn(function(item)
        {
          this.menuItems.splice(this.menuItems.indexOf(item), 1);
        }),
      };
      this.createContextAction = (ActionClass, options) => ({
        action: new ActionClass(this, options),
      });
    }
  }

  return { FileExplorer: MockFileExplorer };
});

jest.mock("../../../../platform/ui/toast/Toast.js", () => ({
  Toast: {
    create: jest.fn(() => ({
      setI18N: jest.fn().mockReturnThis(),
      show: jest.fn(),
    })),
  },
}));

describe("Given the enhanced file explorer", () =>
{
  let explorer;

  beforeEach(() =>
  {
    explorer = new FileExplorerEnhanced({ i18n: {} });
  });

  test("When it initializes, then it replaces built-in file actions and registers custom actions", () =>
  {
    expect(explorer.id).toBe("file_explorer_enhanced");
    expect(explorer.contextMenu.getMenuItem).toHaveBeenCalledWith("action.delete");
    expect(explorer.contextMenu.menuItems.map(item => item.action.constructor)).toEqual([
      CompareModelAction,
      SaveSnapshotAction,
      DeleteProjectDirectoryAction,
      OpenFileActionCustom,
      UploadFolderAction,
    ]);
  });

  test("When it builds folder paths, then it deduplicates paths and sorts by depth", () =>
  {
    const files = [
      { webkitRelativePath: "root/a/one.txt" },
      { webkitRelativePath: "root/a/two.txt" },
      { webkitRelativePath: "root/b/three.txt" },
    ];

    expect(explorer.getFolderPaths(files)).toEqual(["root", "root/a", "root/b"]);
  });

  test("When a folder is uploaded, then it creates directories before writing files", async () =>
  {
    explorer.getFullPath = path => `/remote/${path}`;
    explorer.existsPath = jest.fn().mockResolvedValue(false);
    explorer.showProgressBar = jest.fn();
    explorer.hideProgressBar = jest.fn();
    explorer.makeCollectionPath = jest.fn().mockResolvedValue(undefined);
    explorer.readUploadFileData = jest.fn().mockResolvedValue("file data");
    explorer.writePath = jest.fn().mockResolvedValue(undefined);
    explorer.setUploadFolderProgress = jest.fn();
    explorer.list = jest.fn();
    explorer.showProgressBar = jest.fn();
    const onSuccess = jest.fn();

    await explorer.uploadFolder([
      { name: "one.txt", webkitRelativePath: "root/sub/one.txt" },
    ], onSuccess);

    expect(explorer.makeCollectionPath).toHaveBeenCalledWith("/remote/root");
    expect(explorer.makeCollectionPath).toHaveBeenCalledWith("/remote/root/sub");
    expect(explorer.writePath).toHaveBeenCalledWith("/remote/root/sub/one.txt", "file data");
    expect(explorer.hideProgressBar).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
    expect(explorer.list).toHaveBeenCalled();
  });

  test("When no files have a relative folder path, then it does not start an upload", async () =>
  {
    explorer.showProgressBar = jest.fn();

    await explorer.uploadFolder([{ name: "one.txt", webkitRelativePath: "" }]);

    expect(explorer.showProgressBar).not.toHaveBeenCalled();
  });

  test("When the destination folder already exists, then it shows a warning and stops", async () =>
  {
    explorer.getFullPath = path => `/remote/${path}`;
    explorer.existsPath = jest.fn().mockResolvedValue(true);

    await explorer.uploadFolder([
      { name: "one.txt", webkitRelativePath: "root/one.txt" },
    ]);

    expect(Toast.create).toHaveBeenCalledWith(
      "i2cat|message.folder_already_exists", "root");
    expect(explorer.existsPath).toHaveBeenCalledWith("/remote/root");
  });

  test("When a service operation fails, then it hides progress and delegates error handling", async () =>
  {
    const error = new Error("upload failed");
    explorer.getFullPath = path => `/remote/${path}`;
    explorer.existsPath = jest.fn().mockResolvedValue(false);
    explorer.showProgressBar = jest.fn();
    explorer.hideProgressBar = jest.fn();
    explorer.makeCollectionPath = jest.fn().mockRejectedValue(error);
    explorer.handleError = jest.fn();

    await explorer.uploadFolder([
      { name: "one.txt", webkitRelativePath: "root/one.txt" },
    ]);

    expect(explorer.hideProgressBar).toHaveBeenCalled();
    expect(explorer.handleError).toHaveBeenCalledWith(
      error, true, expect.any(Function));
  });

  test("When service callbacks complete, then path methods resolve or reject by result status", async () =>
  {
    explorer.service = {
      find: jest.fn((path, options, callback) =>
        callback({ status: Result.OK })),
      makeCollection: jest.fn((path, callback) =>
        callback({ status: Result.OK })),
      write: jest.fn((path, data, callback) =>
        callback({ status: Result.ERROR, error: "write failed" })),
    };

    await expect(explorer.existsPath("/folder")).resolves.toBe(true);
    await expect(explorer.makeCollectionPath("/folder")).resolves.toBeUndefined();
    await expect(explorer.writePath("/file", "data")).rejects.toBe("write failed");
    expect(explorer.service.find).toHaveBeenCalledWith(
      "/folder", { depth: "0" }, expect.any(Function));
  });

  test("When upload data is read, then it chooses text or binary mode from the format", async () =>
  {
    const previousFileReader = global.FileReader;
    const readerCalls = [];
    global.FileReader = class
    {
      readAsText(file)
      {
        readerCalls.push(["text", file]);
        this.onload({ target: { result: "text contents" } });
      }

      readAsArrayBuffer(file)
      {
        readerCalls.push(["binary", file]);
        this.onload({ target: { result: new ArrayBuffer(4) } });
      }
    };
    const getFormatInfo = jest.spyOn(IOManager, "getFormatInfo");
    const textFile = { name: "notes.txt" };
    const binaryFile = { name: "model.bin" };

    try
    {
      getFormatInfo.mockReturnValueOnce({ dataType: "text" });
      await expect(explorer.readUploadFileData(textFile)).resolves.toBe("text contents");

      getFormatInfo.mockReturnValueOnce({ dataType: "arraybuffer" });
      const binaryData = await explorer.readUploadFileData(binaryFile);
      expect(binaryData).toBeInstanceOf(ArrayBuffer);
      expect(readerCalls).toEqual([
        ["text", textFile],
        ["binary", binaryFile],
      ]);
    }
    finally
    {
      global.FileReader = previousFileReader;
      getFormatInfo.mockRestore();
    }
  });

  test("When file reading fails, then it rejects with the file name", async () =>
  {
    const previousFileReader = global.FileReader;
    global.FileReader = class
    {
      readAsText()
      {
        this.onerror();
      }
    };
    jest.spyOn(IOManager, "getFormatInfo").mockReturnValue({ dataType: "text" });

    try
    {
      await expect(explorer.readUploadFileData({ name: "broken.txt" }))
        .rejects.toThrow("Can't read file broken.txt.");
    }
    finally
    {
      global.FileReader = previousFileReader;
      jest.restoreAllMocks();
    }
  });

  test("When upload progress is updated, then it reports a rounded percentage", () =>
  {
    explorer.setProgress = jest.fn();

    explorer.setUploadFolderProgress(2, 3);
    explorer.setUploadFolderProgress(0, 0);

    expect(explorer.setProgress).toHaveBeenNthCalledWith(
      1, 67, "Uploading folder...");
    expect(explorer.setProgress).toHaveBeenNthCalledWith(
      2, 100, "Uploading folder...");
  });
});
