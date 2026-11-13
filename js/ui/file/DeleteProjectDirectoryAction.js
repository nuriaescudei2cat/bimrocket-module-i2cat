/**
 * DeleteProjectDirectoryAction.js
 * 
 * @author nuriaescudei2cat
 */

import { ConfirmDialog } from "platform/ui/dialog/ConfirmDialog.js";
import { Toast } from "platform/ui/toast/Toast.js";
import { Metadata, Result } from "platform/io/FileService.js";
import { FileAction } from "platform/ui/file/FileAction.js";

class DeleteProjectDirectoryAction extends FileAction
{
  getLabel()
  {
    return "action.delete";
  }

  getIconName()
  {
    return "trash";
  }

  isEnabled()
  {
    return this.fileExplorer.isEntrySelected();
  }

  async perform()
  {
    const fileExplorer = this.fileExplorer;
    const application = fileExplorer.application;
    const selectedEntry = fileExplorer.selectedEntry;
    const name = selectedEntry?.name;

    if (!name) return;

    if (fileExplorer.service === null)
    {
      ConfirmDialog.create("title.delete_file_service", "question.delete_service", name)
        .setAction(() =>
        {
          const service = application.services[fileExplorer.group][name];
          application.removeService(service, fileExplorer.group);
          fileExplorer.refreshServices();
        })
        .setAcceptLabel("button.delete")
        .setI18N(application.i18n)
        .show();
      return;
    }

    const isFolder = selectedEntry.type === Metadata.COLLECTION;
    let question = "question.delete_file";

    if (isFolder)
    {
      const isNotEmpty = await this.isDirectoryNotEmpty(selectedEntry.name);
      question = isNotEmpty
        ? "i2cat|question.delete_folder_project_directory"
        : "question.delete_folder";
    }

    ConfirmDialog.create("title.delete_from_file_service", question, name)
      .setAction(() =>
      {
        if (isFolder)
        {
          this.handleDeleteDirectory();
        }
        else
        {
          fileExplorer.remove();
        }
      })
      .setAcceptLabel("button.delete")
      .setI18N(application.i18n)
      .show();
  }

  async isDirectoryNotEmpty(entryName)
  {
    const fileExplorer = this.fileExplorer;
    if (!fileExplorer?.service) return false;

    const directoryPath = fileExplorer.getFullPath(entryName);

    return new Promise(resolve =>
    {
      fileExplorer.service.open(directoryPath, result =>
      {
        if (result.status !== Result.OK)
        {
          resolve(true); // En cas de dubte, mantenir avís preventiu
          return;
        }

        const entries = result.entries || [];
        resolve(entries.length > 0);
      });
    });
  }

  async handleDeleteDirectory()
  {
    const fileExplorer = this.fileExplorer;
    const selectedEntry = fileExplorer.selectedEntry;

    if (!selectedEntry) return;

    const directoryPath = fileExplorer.getFullPath(selectedEntry.name);
    const projectId = selectedEntry.name;

    try
    {
      fileExplorer.showProgressBar("Deleting...");
      const result = await this.deleteDirectory(directoryPath, projectId);
      fileExplorer.hideProgressBar();

      if (result?.directoryDeleted)
      {
        Toast.create("message.folder_deleted")
          .setI18N(fileExplorer.application.i18n)
          .show();

        fileExplorer.selectedEntry = null;
        fileExplorer.list();
        fileExplorer._source = null;
      }
      else
      {
        Toast.create("i2cat|message.folder_not_deleted")
          .setI18N(fileExplorer.application.i18n)
          .show();
      }
    }
    catch (error)
    {
      fileExplorer.hideProgressBar();
      fileExplorer.handleError(error, true, () => this.handleDeleteDirectory());
    }
  }

  async deleteDirectory(path, projectId)
  {
    const deleteDirectoryHandler = this.options?.deleteDirectoryHandler;

    if (typeof deleteDirectoryHandler !== "function")
    {
      throw new Error("deleteDirectoryHandler must be provided in action options.");
    }

    return deleteDirectoryHandler(path, projectId, {
      application: this.fileExplorer.application,
      fileService: this.fileExplorer.service,
    });
  }
}

export { DeleteProjectDirectoryAction };