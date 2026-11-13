/**
 * UploadFolderAction.js
 *
 * @author nuriaescudei2cat
 */

import { Toast } from "platform/ui/toast/Toast.js";
import { FileAction } from "platform/ui/file/FileAction.js";

class UploadFolderAction extends FileAction
{
  constructor(fileExplorer)
  {
    super(fileExplorer);
  }

  getLabel()
  {
    return "i2cat|action.upload_folder";
  }

  getIconName()
  {
    return "i2cat|upload_folder";
  }

  isEnabled()
  {
    return this.fileExplorer.isDirectoryList();
  }

  perform()
  {
    const inputFile = document.createElement("input");

    inputFile.type = "file";
    inputFile.multiple = true;
    inputFile.style.display = "none";

    if (!("webkitdirectory" in inputFile))
    {
      Toast.create("i2cat|message.upload_folder_not_supported")
        .setI18N(this.fileExplorer.application.i18n).show();
      return;
    }

    inputFile.webkitdirectory = true;
    document.body.appendChild(inputFile);

    inputFile.addEventListener("change", async () =>
    {
      try
      {
        if (typeof this.fileExplorer.uploadFolder === "function")
        {
          await this.fileExplorer.uploadFolder(inputFile.files);
        }
        else
        {
          throw new Error("uploadFolder is not implemented in fileExplorer");
        }
      }
      finally
      {
        if (document.body.contains(inputFile))
        {
          document.body.removeChild(inputFile);
        }
      }
    });

    inputFile.click();
  }

}

export { UploadFolderAction };
