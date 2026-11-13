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
  const configuredProcedureNames = Object.keys(
    proceduresConfig?.PROCEDURE_RULES?.procedures || {},
  );
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

async function findPath(fileService, path)
{
  return toPromise((resolve, reject) =>
  {
    fileService.find(path, null, result =>
    {
      if (result.status === Result.OK) resolve(result);
      else reject(result.error || new Error("Path not found"));
    });
  });
}

async function removePath(fileService, path)
{
  return toPromise((resolve, reject) =>
  {
    fileService.remove(path, result =>
    {
      if (result.status === Result.OK) resolve();
      else reject(result.error || new Error("Path deletion failed"));
    });
  });
}

async function removeDirectoryRecursively(fileService, path)
{
  const currentPath = compactPath(path);
  if (currentPath === "/") throw new Error("Root path deletion is not allowed.");

  const result = await findPath(fileService, currentPath);
  if (result.metadata?.type === Metadata.FILE)
  {
    await removePath(fileService, currentPath);
    return;
  }

  const entries = result.entries || [];
  await Promise.all(
    entries.map(entry =>
    {
      const childPath = compactPath(`${currentPath}/${entry.name}`);
      return entry.type === Metadata.COLLECTION
        ? removeDirectoryRecursively(fileService, childPath)
        : removePath(fileService, childPath);
    }),
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

function matchesProcedure(taskData, procedureType, application)
{
  const procedureMatchers = getProcedureMatchers(application);
  const allowedProcedures = procedureMatchers[procedureType] || [];

  const tramit = taskData?.data?.tramit || null;
  return allowedProcedures.includes(tramit);
}

function buildCandidateIds(...projectIds)
{
  const uniqueIds = new Set();

  projectIds.forEach(projectId =>
  {
    const base = String(projectId || "").trim();
    if (!base) return;

    const withDollar = base.replace(/-/g, "$");
    const withHyphen = base.replace(/\$/g, "-");
    [base, withDollar, withHyphen].forEach(candidate => uniqueIds.add(candidate));
  });

  return [...uniqueIds];
}

async function getTaskData(taskService, taskId)
{
  return toPromise((resolve, reject) => taskService.getData(taskId, resolve, reject));
}

async function deleteTaskData(taskService, taskId)
{
  return toPromise((resolve, reject) => taskService.deleteData(taskId, resolve, reject));
}

async function deleteBCFProject(bcfService, projectId)
{
  return toPromise((resolve, reject) => bcfService.deleteProject(projectId, resolve, reject));
}

async function getBCFProjects(bcfService, nameFilter = "")
{
  const filter = { nameFilter: String(nameFilter || "").trim() };
  return toPromise((resolve, reject) => bcfService.getProjects(filter, "name", resolve, reject));
}

function getTaskProjectFolder(taskData)
{
  return taskData?.data?.projectFolder || taskData?.projectFolder || null;
}

async function deleteMatchingBCFProject(bcfService, ...ids)
{
  const candidateIds = buildCandidateIds(...ids);
  console.log(`Attempting to delete BCF projects with candidate IDs: ${candidateIds.join(", ")}`);
  for (const candidateId of candidateIds)
  {
    try
    {
      await deleteBCFProject(bcfService, candidateId);
      console.log(`Successfully deleted BCF project with ID: ${candidateId}`);
      return candidateId;
    }
    catch (error)
    {
      console.warn(`Error BCF ID: ${candidateId}:`, error?.message);
    }
  }

  return null;
}

async function findMatchingTaskId(taskService, projectId, procedureType, application)
{
  const candidateIds = buildCandidateIds(projectId);
  for (const candidateId of candidateIds)
  {
    try
    {
      const taskData = await getTaskData(taskService, candidateId);
      if (taskData && matchesProcedure(taskData, procedureType, application))
      {
        return candidateId;
      }
    }
    catch (error)
    {
      if (error?.code === ServiceError.NOT_FOUND) continue;
      throw error;
    }
  }
  return null;
}

function normalizeProjectToken(value)
{
  return String(value || "").trim().replace(/\$/g, "-").toLowerCase();
}

function findProjectByFolderName(serverProjects, folderName)
{
  const targetCandidates = buildCandidateIds(folderName)
    .map(candidate => normalizeProjectToken(candidate));

  return (serverProjects || []).find(project =>
  {
    const projectId = project?.project_id || project?.id || "";
    const projectName = project?.name || "";

    const normalizedId = normalizeProjectToken(projectId);
    const normalizedName = normalizeProjectToken(projectName);

    return targetCandidates.includes(normalizedId) || targetCandidates.includes(normalizedName);
  }) || null;
}

async function findProjectByTaskProjectFolder(taskService, bcfService, folderName, procedureType, application)
{
  const projects = await getBCFProjects(bcfService, "");
  const targetFolder = normalizeProjectToken(folderName);
  const folderCandidates = buildCandidateIds(folderName)
    .map(candidate => normalizeProjectToken(candidate));

  const matches = [];

  for (const project of projects || [])
  {
    const projectId = project?.project_id || project?.id || null;
    if (!projectId) continue;

    try
    {
      const taskData = await getTaskData(taskService, projectId);
      if (!taskData || !matchesProcedure(taskData, procedureType, application)) continue;

      const taskProjectFolder = getTaskProjectFolder(taskData);
      if (!taskProjectFolder) continue;

      if (normalizeProjectToken(taskProjectFolder) !== targetFolder) continue;

      matches.push({ projectId, taskId: projectId });
    }
    catch (error)
    {
      if (error?.code === ServiceError.NOT_FOUND) continue;
      throw error;
    }
  }

  if (matches.length === 0) return null;

  const preferred = matches.find(match =>
    !folderCandidates.includes(normalizeProjectToken(match.projectId)));

  return preferred || matches[0];
}

async function resolveDeletionIds(taskService, bcfService, folderName, procedureType, application)
{
  const mappedProject = await findProjectByTaskProjectFolder(
    taskService,
    bcfService,
    folderName,
    procedureType,
    application,
  );
  if (mappedProject)
  {
    return {
      realTaskId: mappedProject.taskId,
      realBcfId: mappedProject.projectId,
      resolutionMethod: "taskData.projectFolder",
    };
  }

  let taskId = await findMatchingTaskId(taskService, folderName, procedureType, application);
  if (taskId)
  {
    return {
      realTaskId: taskId,
      realBcfId: taskId,
      resolutionMethod: "directTaskIdCandidates",
    };
  }

  let project = null;
  try
  {
    const serverProjects = await getBCFProjects(bcfService, folderName);
    project = findProjectByFolderName(serverProjects, folderName);
  }
  catch (error)
  {
    console.warn("No s'ha pogut resoldre el projecte BCF per nom de carpeta:", error?.message);
  }

  const realBcfId = project?.project_id || project?.id || null;

  if (realBcfId)
  {
    taskId = await findMatchingTaskId(taskService, realBcfId, procedureType, application);
  }

  return {
    realTaskId: taskId || null,
    realBcfId,
    resolutionMethod: realBcfId ? "bcfNameOrId" : "unresolved",
  };
}

async function executeDirectoryDeletion(directoryPath, folderName, procedureType, context)
{
  const application = context?.application;
  const fileService = context?.fileService;

  if (!application) throw new Error("Application context is required.");
  if (!fileService) throw new Error("File service is required.");

  const taskService = getTaskService(application);
  const bcfService = getBCFService(application);

  const { realTaskId, realBcfId, resolutionMethod } = await resolveDeletionIds(
    taskService,
    bcfService,
    folderName,
    procedureType,
    application,
  );

  console.log(
    `Resolved deletion IDs (method=${resolutionMethod}): folder=${folderName}, bcfId=${realBcfId || "null"}, taskId=${realTaskId || "null"}`,
  );

  let taskDeleted = false;
  let bcfDeleted = false;

  if (realBcfId || realTaskId)
  {
    const deletedBCFId = await deleteMatchingBCFProject(
      bcfService,
      realBcfId,
      realTaskId,
    );
    bcfDeleted = Boolean(deletedBCFId);

    if (realBcfId && !bcfDeleted)
    {
      console.warn(`No s'ha pogut eliminar el projecte BCF resolt: ${realBcfId}`);
    }
  }
  else
  {
    console.warn("No s'ha resolt cap ID de BCF. S'omet l'eliminació del projecte BCF per evitar un esborrat incorrecte.");
  }

  if (realTaskId)
  {
    await deleteTaskData(taskService, realTaskId);
    taskDeleted = true;
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

export { executeDirectoryDeletion };
