/**
 * DeleteProjectDirectoryService.js
 *
 * @author nuriaescudei2cat
 */

import { Metadata, Result } from "platform/io/FileService.js";
import { ServiceError } from "platform/io/Service.js";

function getProcedureMatchers(application)
{
  const proceduresConfig = application?.default_properties?.getProceduresConfig?.();
  const configuredProcedureNames = Object.keys(proceduresConfig?.PROCEDURE_RULES?.procedures || {});
  return {
    SEGUIMENT_PROJECTE: ["seguiment-projecte"],
    AUTORITZACIO_AMBIENTAL_LLICENCIA_OBRA: configuredProcedureNames,
  };
}

function compactPath(path)
{
  if (!path) return "/";
  const compact = String(path).replace(/\/+/g, "/");
  return compact.length > 1 ? compact.replace(/\/+$/, "") : compact;
}

function toPromise(fn)
{
  return new Promise((resolve, reject) => fn(resolve, reject));
}

async function removePath(fileService, path)
{
  return toPromise((resolve, reject) => {
    fileService.remove(path, result => {
      if (result.status === Result.OK) resolve();
      else reject(result.error || new Error("Path deletion failed"));
    });
  });
}

async function findPath(fileService, path)
{
  return toPromise((resolve, reject) => {
    fileService.find(path, null, result => {
      if (result.status === Result.OK) resolve(result);
      else reject(result.error || new Error("Path not found"));
    });
  });
}

async function removeDirectoryRecursively(fileService, path)
{
  const currentPath = compactPath(path);
  if (currentPath === "/") throw new Error("Root path deletion is not allowed.");

  const result = await findPath(fileService, currentPath);
  if (result.metadata?.type === Metadata.FILE) {
    await removePath(fileService, currentPath);
    return;
  }

  const entries = result.entries || [];
  await Promise.all(
    entries.map(entry => {
      const childPath = compactPath(`${currentPath}/${entry.name}`);
      return entry.type === Metadata.COLLECTION
        ? removeDirectoryRecursively(fileService, childPath)
        : removePath(fileService, childPath);
    })
  );

  await removePath(fileService, currentPath);
}

function getTaskService(application)
{
  const taskService = application?.services?.task_executions?.tasks;
  if (!taskService) throw new Error("Task service not available.");
  return taskService;
}

function getBCFService(application)
{
  const bcfGroup = application?.services?.bcf;
  if (!bcfGroup) throw new Error("BCF service group not available.");
  const serviceName = Object.keys(bcfGroup)[0];
  const bcfService = bcfGroup[serviceName];
  if (!bcfService) throw new Error("BCF service not available.");
  return bcfService;
}

async function resolveDeletionIds(taskService, folderName, procedureType, application)
{
  try {
    const tasksResponse = await toPromise((resolve, reject) => taskService.getExecutions(null, resolve, reject));
    const taskList = Array.isArray(tasksResponse) ? tasksResponse : (tasksResponse.entries || tasksResponse.data || []);

    const procedureMatchers = getProcedureMatchers(application);
    const allowedProcedures = procedureMatchers[procedureType] || [];

    for (const taskEntry of taskList) {
      const taskId = taskEntry.id || taskEntry.name;
      if (!taskId) continue;

      const dataObj = taskEntry.input || taskEntry.data || {};
      const taskProjectFolder = dataObj.projectFolder || dataObj.project_folder || "";

      if (taskProjectFolder === folderName) {
        console.log(`[DEBUG] Coincidència de carpeta trobada a la tasca: ${taskId}`);

        const tramit = dataObj.tramit || null;

        if (allowedProcedures.includes(tramit)) {
          return {
            realTaskId: taskId,
            realBcfId: dataObj.project_id || dataObj.projectId || taskId
          };
        } else {
          console.log(`[DEBUG] El tràmit no coincideix. Esperat: [${allowedProcedures.join(", ")}], Trobat: ${tramit}`);
        }
      }
    }
  } catch (error) {
    console.warn("[DEBUG] Error obtenint la llista de tasques:", error);
  }

  return { realTaskId: null, realBcfId: null };
}

async function executeDirectoryDeletion(directoryPath, folderName, procedureType, context)
{
  const application = context?.application;
  const fileService = context?.fileService;

  if (!application) throw new Error("Application context is required.");
  if (!fileService) throw new Error("File service is required.");

  const taskService = getTaskService(application);
  const bcfService = getBCFService(application);

  const { realTaskId, realBcfId } = await resolveDeletionIds(taskService, folderName, procedureType, application);

  console.log(`Resolved IDs for folder ${folderName}: BcfID=${realBcfId || "None"}, TaskID=${realTaskId || "None"}`);

  let taskDeleted = false;
  let bcfDeleted = false;

  if (realBcfId) {
    try {
      await toPromise((resolve, reject) => bcfService.deleteProject(realBcfId, resolve, reject));
      console.log(`Successfully deleted BCF project with ID: ${realBcfId}`);
      bcfDeleted = true;
    } catch (error) {
      if (error?.code !== ServiceError.NOT_FOUND) {
        console.warn(`Error esborrant BCF ID ${realBcfId}:`, error?.message);
      }
    }
  }

  if (realTaskId) {
    try {
      await toPromise((resolve, reject) => taskService.deleteData(realTaskId, resolve, reject));
      console.log(`Successfully deleted Task with ID: ${realTaskId}`);
      taskDeleted = true;
    } catch (error) {
      if (error?.code !== ServiceError.NOT_FOUND) {
        console.warn(`Error esborrant tasca ${realTaskId}:`, error?.message);
      }
    }
  }

  await removeDirectoryRecursively(fileService, directoryPath);
  console.log(`Directory deleted: ${directoryPath}`);

  return {
    directoryDeleted: true,
    taskDeleted,
    bcfDeleted,
    taskId: realTaskId,
  };
}

export async function deleteSeguimentDirectory(path, project_id, context)
{
  return executeDirectoryDeletion(path, project_id, "SEGUIMENT_PROJECTE", context);
}

export async function deleteProcessingPermitsDirectory(path, project_id, context)
{
  return executeDirectoryDeletion(path, project_id, "AUTORITZACIO_AMBIENTAL_LLICENCIA_OBRA", context);
}