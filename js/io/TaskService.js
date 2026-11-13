/**
   * TaskService.js
   *
   * @author alexis-i2cat
   */

import { Service } from "platform/io/Service.js";
import { ServiceManager } from "platform/io/ServiceManager.js";
import { RestServiceClient } from "platform/io/RestServiceClient.js";

const headers = { "Content-Type" : "application/json" };

class TaskService extends Service
{
  constructor(parameters)
  {
    super(parameters);
    this.client = new RestServiceClient(this);
    if (this.serverType === undefined) this.serverType = "bimrocket";
  }

  createData(taskData, onCompleted, onError)
  {
    const body = JSON.stringify(taskData);
    this.client.call("PUT", "task/data", { headers, body, onCompleted, onError });
  }

  deleteData(taskId, onCompleted, onError)
  {
    this.client.call("DELETE", `task/data/${taskId}`, { onCompleted, onError });
  }

  getData(taskId, onCompleted, onError)
  {
    this.client.call("GET", `task/data/${taskId}`, { onCompleted, onError });
  }

  getExecutions(taskData, onCompleted, onError)
  {
    this.client.call("GET", "task/executions", { onCompleted, onError });
  }

  createExecutions(taskData, onCompleted, onError)
  {
    const body = JSON.stringify(taskData);
    this.client.call("PUT", "task/executions", { headers, body, onCompleted, onError });
  }

  deleteExecutionsById(taskData, onCompleted, onError)
  {
    this.client.call("DELETE", `task/executions/${taskData.id}`, { onCompleted, onError });
  }

  getExecutionsById(taskData, onCompleted, onError)
  {
    this.client.call("GET", `task/executions/${taskData.id}`, { onCompleted, onError });
  }
}

ServiceManager.addClass(TaskService);

export { TaskService };
