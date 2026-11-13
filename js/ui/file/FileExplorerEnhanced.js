/**
 * FileExplorerEnhanced.js
 *
 * @author nuriaescudei2cat
 * @author alexis-i2cat
 */

import { Result } from "platform/io/FileService.js";
import { IOManager } from "platform/io/IOManager.js";
import { Toast } from "platform/ui/toast/Toast.js";
import { FileExplorer } from "platform/ui/file/FileExplorer.js";
import { deleteSeguimentDirectory } from "../../io/DeleteProjectDirectoryService.js";
import { DeleteProjectDirectoryAction } from "./DeleteProjectDirectoryAction.js";
import { OpenFileActionCustom } from "./OpenFileAction.js";
import { CompareModelAction } from "modules/bim/ui/file/CompareModelAction.js";
import { SaveSnapshotAction } from "modules/bim/ui/file/SaveSnapshotAction.js";
import { UploadFolderAction } from "./UploadFolderAction.js";
import { OpenFileAction } from "modules/base/ui/file/OpenFileAction.js";

class FileExplorerEnhanced extends FileExplorer
{
  constructor(application, addContextActions = true)
  {
    super(application, addContextActions);
    this.id = "file_explorer_enhanced";
    this.setupEnhancedMenu();
  }

  setupEnhancedMenu()
  {
    const contextMenu = this.contextMenu;
    const action = this.createContextAction;

    let openModelMenuItem = contextMenu.getMenuItem("base|action.open_model");
    if (openModelMenuItem)
    {
      let index = openModelMenuItem.getIndex();
      contextMenu.addMenuItem(action(CompareModelAction), index + 1);
    }
    else
    {
      contextMenu.addMenuItem(action(CompareModelAction), "default:top");
    }
    contextMenu.addMenuItem(action(SaveSnapshotAction), "save");

    const deleteItem = contextMenu.getMenuItem("action.delete");
    if (deleteItem) deleteItem.remove();

    contextMenu.addMenuItem(action(DeleteProjectDirectoryAction, {
      deleteDirectoryHandler: (path, projectId, context) =>
        deleteSeguimentDirectory(path, projectId, context),
    }), "general");

    for (let index = contextMenu.menuItems.length - 1; index >= 0; index--)
    {
      const menuItem = contextMenu.menuItems[index];
      if (menuItem.action instanceof OpenFileAction)
      {
        contextMenu.removeMenuItem(menuItem);
      }
    }

    contextMenu.addMenuItem(action(OpenFileActionCustom), "default");

    contextMenu.addMenuItem(action(UploadFolderAction), "upload_download");
  }

  async uploadFolder(fileList, onSuccess)
  {
    const files = [...(fileList || [])]
      .filter(file => file.webkitRelativePath && file.webkitRelativePath.includes("/"));

    if (files.length === 0) return;

    const rootFolderNames = Array.from(new Set(
      files.map(file => file.webkitRelativePath.split("/")[0])));

    for (let rootFolderName of rootFolderNames)
    {
      const path = this.getFullPath(rootFolderName);
      if (await this.existsPath(path))
      {
        Toast.create("i2cat|message.folder_already_exists", rootFolderName)
          .setI18N(this.application.i18n).show();
        return;
      }
    }

    try
    {
      this.showProgressBar("Uploading folder...");

      const folderPaths = this.getFolderPaths(files);
      let done = 0;
      const totalSteps = folderPaths.length + files.length;

      for (let folderPath of folderPaths)
      {
        const remoteFolderPath = this.getFullPath(folderPath);
        await this.makeCollectionPath(remoteFolderPath);
        done++;
        this.setUploadFolderProgress(done, totalSteps);
      }

      for (let file of files)
      {
        const data = await this.readUploadFileData(file);
        const remotePath = this.getFullPath(file.webkitRelativePath);
        await this.writePath(remotePath, data);
        done++;
        this.setUploadFolderProgress(done, totalSteps);
      }

      this.hideProgressBar();
      Toast.create("i2cat|message.folder_uploaded")
        .setI18N(this.application.i18n).show();

      onSuccess?.();
      this.list();
    }
    catch (error)
    {
      this.hideProgressBar();
      this.handleError(error, true,
        () => this.uploadFolder(files, onSuccess));
    }
  }

  getFolderPaths(files)
  {
    const folderPaths = new Set();

    for (let file of files)
    {
      const parts = file.webkitRelativePath.split("/");
      let currentPath = "";

      for (let i = 0; i < parts.length - 1; i++)
      {
        currentPath = currentPath ? currentPath + "/" + parts[i] : parts[i];
        folderPaths.add(currentPath);
      }
    }

    return [...folderPaths].sort((a, b) =>
      a.split("/").length - b.split("/").length);
  }

  setUploadFolderProgress(done, total)
  {
    const progress = total > 0 ? Math.round(100 * done / total) : 100;
    this.setProgress(progress, "Uploading folder...");
  }

  existsPath(path)
  {
    return new Promise(resolve =>
    {
      this.service.find(path, { depth : "0" }, result =>
      {
        resolve(result.status === Result.OK);
      });
    });
  }

  makeCollectionPath(path)
  {
    return new Promise((resolve, reject) =>
    {
      this.service.makeCollection(path, result =>
      {
        if (result.status === Result.OK) resolve();
        else reject(result.error);
      });
    });
  }

  writePath(path, data)
  {
    return new Promise((resolve, reject) =>
    {
      this.service.write(path, data, result =>
      {
        if (result.status === Result.OK) resolve();
        else reject(result.error);
      });
    });
  }

  readUploadFileData(file)
  {
    return new Promise((resolve, reject) =>
    {
      const reader = new FileReader();

      reader.onload = event =>
      {
        resolve(event.target.result);
      };

      reader.onerror = () =>
      {
        reject(new Error(`Can't read file ${file.name}.`));
      };

      const formatInfo = IOManager.getFormatInfo(file.name);
      if (formatInfo?.dataType === "text")
      {
        reader.readAsText(file);
      }
      else
      {
        reader.readAsArrayBuffer(file);
      }
    });
  }
}

export { FileExplorerEnhanced };
