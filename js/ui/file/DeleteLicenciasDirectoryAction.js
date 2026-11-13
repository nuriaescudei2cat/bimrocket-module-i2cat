/**
 * DeleteProcessingPermitsDirectoryAction.js
 * 
 * @author nuriaescudei2cat
 */

import { DeleteProjectDirectoryAction } from "./DeleteProjectDirectoryAction.js";
import { deleteProcessingPermitsDirectory } from "./DeleteProjectDirectoryService.js";

class DeleteProcessingPermitsDirectoryAction extends DeleteProjectDirectoryAction
{
  async deleteDirectory(path, projectId)
  {
    return deleteProcessingPermitsDirectory(path, projectId, {
      application: this.fileExplorer.application,
      fileService: this.fileExplorer.service,
    });
  }
}

export { DeleteProcessingPermitsDirectoryAction };
