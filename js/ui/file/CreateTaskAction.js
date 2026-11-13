/**
 * CreateTaskAction.js
 *
 * @author alexis-i2cat
 */

import { TaskAction } from "./TaskAction.js";

class CreateTaskAction extends TaskAction
{
  getLabel()
  {
    return "i2cat|action.new_task";
  }

  getIconName()
  {
    return "i2cat|task_script";
  }

  isEnabled()
  {
    return this.fileExplorer.isDirectoryList();
  }

  perform()
  {
    this.setTask("", "", false);
  }
}

export { CreateTaskAction };
