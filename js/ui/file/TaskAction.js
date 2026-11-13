/**
 * TaskAction.js
 *
 * @author alexis-i2cat
 */

import { FileAction } from "platform/ui/file/FileAction.js";
import { ScriptDialog } from "modules/base/ui/ScriptDialog.js";

class TaskAction extends FileAction
{
  constructor(fileExplorer, options)
  {
    super(fileExplorer, options);

    if (!fileExplorer.taskDialog)
    {
      fileExplorer.taskDialog = new ScriptDialog(fileExplorer);
    }
  }

  isEnabled()
  {
    return this.fileExplorer.isFileEntrySelected();
  }

  setTask(url, code, run = false)
  {
    const fileExplorer = this.fileExplorer;
    const taskDialog = fileExplorer.taskDialog;

    const index = url.lastIndexOf("/");
    let name = url.substring(index + 1);

    taskDialog.scriptName = name;
    taskDialog.scriptCode = code;
    taskDialog.clearConsole();

    if (run)
    {
      let error = taskDialog.run();

      if (error)
      {
        taskDialog.show();
      }
    }
    else
    {
      taskDialog.show();
    }
  }
}

export { TaskAction };
