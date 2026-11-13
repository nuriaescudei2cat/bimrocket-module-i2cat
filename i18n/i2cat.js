/**
 * i2cat.js
 *
 */

export const translations =
{
  // SeguimentProjecte
  "tool.seguiment_projecte.label" : "Copy Project tracking",
  "tool.seguiment_projecte.help" : "Project tracking",

  "action.upload_folder" : "Upload folder",

  "message.folder_uploaded" : "Folder uploaded.",
  "message.upload_folder_not_supported" : "Uploading folders is only available in Chromium-based browsers.",
  "message.folder_already_exists" : name => `The folder ${name} already exists at the destination.`,
  "message.folder_not_deleted" : "Folder not deleted.",

  "question.delete_folder_project_directory": name => `Do you want to delete the project directory ${name}? Its subdirectories and files will also be deleted.`,

  // Processing Permits
  "tool.processing_permits.label": "Processing permits",
  "tool.processing_permits.help" : "Processing permits",

  // Tasks
  "tool.task.label": "Tasks",

  "action.new_task" : "Task",
  "action.run_task" : "Run task",
  "action.edit_task" : "Edit task",

  // UploadModel
  "button.validate" : "Validate",

  "tool.upload_model.label" : "Validate and save model",
  "tool.upload_model.help" : "Validate and save model",
  "tool.upload_model.select_process" : "Select procedure type",
  "tool.upload_model.select_option" : "Select procedure",
  "tool.upload_model.validation_model_error" : "No IFC file opened",
  "tool.upload_model.validation_option_error": "No option selected",
  "tool.upload_model.validation_rule_error": "No rule found for the selected option",
  "tool.upload_model.validation_warning_success": warnings => `The model has passed validation with ${warnings} warnings. You can now send it`,
  "tool.upload_model.validation_output_error": "The model has errors. You must fix them before sending",
  "tool.upload_model.validation_success": "The model has passed validation. You can now send it",
  "tool.upload_model.validation_service_error": "You are not authorized to perform this action.",
  "tool.upload_model.folder_error": "The folder for the selected procedure was not found",
  "tool.upload_model.upload_warning_success": name => `Model saved with some warnings. Click the following link to copy and paste it into the processing form:\n\n${name}`,
  "tool.upload_model.upload_success": name => `Model saved.  Click the following link to copy and paste it into the processing form:\n\n${name}`,
  "tool.upload_model.upload_error": "The model could not be uploaded.",
  "tool.upload_model.authentication_error": "Authentication error: Please verify your username and password.",
  "tool.upload_model.validation_warning": "Keep in mind that the tool allows you to validate considering the changes made since the import. However, if you proceed with saving, the saved model will not include those changes.",
  "tool.upload_model.verifying_project": "Verifying project...",
  "tool.upload_model.uploading_model": "Uploading model...",
  "tool.upload_model.create_project_error": "The model has been uploaded but the project metadata could not be created.",
  "tool.upload_model.update_version_error": "The new version of the model has been uploaded but the project metadata could not be updated.",

  "message.upload_model.credentials_required": "This action requires authentication",
  "message.upload_model.upload_phase_error" : "At the stage the project is currently in, uploading new versions is not allowed",
  "message.upload_model.project_in_other_tramit": tramit => `This project ID is already associated with procedure ${tramit} and cannot belong to more than one procedure.`,
  "message.upload_model.path_copy_title" : "Copy path",
  "message.upload_model.path_copied" : "File path copied to clipboard",
  "message.upload_model.select_plant": "Select subprocedure",
  "message.upload_model.select_zone": "Select zone",
  

  "title.path_copy" : "Copy path",

  // SelectByView
  "tool.select_by_view.label": "View by Area",
  "tool.select_by_view.help": "View by Area",
  "tool.select_by_view.select_view": "Select area",
  "tool.select_by_view.select_option": "Select area",
  "tool.select_by_view.validation_model_error": "No IFC model has been opened",
  "tool.select_by_view.validation_option_error": "No option has been selected",
  "tool.select_by_view.validation_view_error": "The area for the selected option was not found",
  "tool.select_by_view.validation_output_error": "The selected area is not valid",
  "tool.select_by_view.validation_success": "The view is valid",
  "tool.select_by_view.script_load_error": "Error, view can not be loaded",
  "tool.select_by_view.script_execution_error": "Error, view can not be executed",

  // BCF
  "label.review_status_change": "Review status change",
  "label.project_tracking": "Project tracking",
  "label.final_save": "Final save",

  "button.start_internal_petitions": "Start internal petitions",
  "button.end_internal_petitions": "End internal petitions",
  "button.init_requirement": "Start requirement",
  "button.end_requirement": "End requirement",
  "button.init_public_phase": "Public phase",
  "button.end_preproject_start_basic": "End preproject - start basic",
  "button.end_basic_start_executive": "End basic - start executive",
  "button.end_executive": "End executive",
  "button.save_model_to_db": "Resolution",
  "button.project_status": "Project status",
  "button.open_checklist_topic": "Open list",
  "button.open_checklist_topic_unavailable": "No checklist associated",

  "message.bcf_no_pv_projects": "Any loaded model was found",
  "message.bcf_only_v_projects": "Some loaded projects haven't been saved to the repository so they can't use the BCF system until they are",
  "message.extensions_start_internal": "Internal petitions started successfully.",
  "message.extensions_end_internal": "Internal petitions ended successfully.",
  "message.extensions_init_requirement": "Requirement started successfully.",
  "message.extensions_end_requirement": "Requirement ended successfully.",
  "message.extensions_start_public_phase": "Public phase started successfully.",
  "message.extensions_end_preproject_start_basic": "Preproject has ended and basic phase has started successfully.",
  "message.extensions_end_basic_start_executive": "Basic phase has ended and executive phase has started successfully.",
  "message.extensions_end_executive": "Executive phase ended successfully.",
  "message.phase_error": "An error has occurred.",
  "message.phase_requirements_missing": "Phase change is not allowed yet. Required checks are missing.",
  "message.model_saved_to_db": "The model has been successfully saved in the database.",
  "message.model_saved_to_db_error": "An error has occurred while saving the model in the database.",
  "message.project_status_loading": "Loading project status summary...",
  "message.project_status_no_project": "Select a project to check its status.",
  "message.project_status_no_checklist": "No checklist was found for the current phase.",
  "message.project_status_no_checks_marked": "(none marked)",
  "message.project_status_no_checklist_tooltip": "A checklist cannot be opened because none is associated with the project's current phase.",
  "message.project_status_unknown_phase": "Unknown phase",
  "message.project_status_error": "Project status summary could not be loaded.",

  "title.project_status_summary": "Status summary",
  "label.project_procedure_name": "Procedure name",
  "label.project_phase": "Current phase",
  "label.project_current_status": "Current status",
  "label.project_record": "Record",
  "label.project_folder": "Project folder",
  "label.project_current_version": "Current version",
  "label.project_company": "Company",
  "label.project_author": "Author",
  "label.project_current_checklist_progress": "Current list progress",
  "label.project_checklist_recommended": "Recommended checklist",
  "label.phase_preproject": "Preproject",
  "label.phase_basic": "Basic",
  "label.phase_executive": "Executive",
  "label.phase_finalized": "Finalized",

  "tool.bcf.button.connect": "Refresh",

  "tab.checklist": "Checklist",

  // GIS
  "button.update": "Update",

  "tool.gis.label": "Geographic information layers",
  "tool.gis.help": "Displays layers from geographic information services (WMS)",
  "tool.gis.select_process": "Select the type of procedure",
  "tool.gis.select_option": "Select the procedure",
  "tool.gis.validation_option_error": "No option has been selected",
  "tool.gis.validation_model_error": "No IFC model has been opened",
};
