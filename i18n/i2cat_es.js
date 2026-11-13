/**
 * i2cat_es.js
 *
 */

export const translations =
{
  // SeguimentProjecte
  "tool.seguiment_projecte.label" : "Seguimiento de proyecto",
  "tool.seguiment_projecte.help" : "Seguimiento de proyecto",

  "action.upload_folder" : "Subir carpeta",

  "message.folder_uploaded" : "Carpeta subida.",
  "message.upload_folder_not_supported" : "La subida de carpetas solo está disponible en navegadores basados en Chromium.",
  "message.folder_already_exists" : name => `La carpeta ${name} ya existe en el destino.`,
  "message.folder_not_deleted" : "La carpeta no se ha borrado.",

  // Processing Permits
  "tool.processing_permits.label": "Licencias / autorizaciones (en trámite)",
  "tool.processing_permits.help" : "Licencias / autorizaciones (en trámite)",

  // Tasks
  "tool.task.label": "Tareas",

  "action.new_task" : "Tarea",
  "action.run_task" : "Ejecuta tarea",
  "action.edit_task" : "Edita tarea",

  // UploadModel
  "button.validate" : "Valida",

  "tool.upload_model.label" : "Valida y guarda el modelo",
  "tool.upload_model.help" : "Valida y guarda el modelo",
  "tool.upload_model.select_process" : "Selecciona el tipo de procedimento",
  "tool.upload_model.select_option" : "Selecciona el procedimento",
  "tool.upload_model.validation_model_error": "No has abierto ningún modelo IFC",
  "tool.upload_model.validation_option_error": "No has seleccionado ninguna opción",
  "tool.upload_model.validation_rule_error": "No se ha encontrado la regla para la opción seleccionada",
  "tool.upload_model.validation_warning_success": warnings => `El modelo ha pasado la validación con ${warnings} alertas. Ya puedes enviarlo`,
  "tool.upload_model.validation_output_error": "El modelo tiene errores. Debes corregirlos antes de enviarlo",
  "tool.upload_model.validation_success": "El modelo ha pasado la validación. Ya puedes enviarlo",
  "tool.upload_model.validation_service_error": "No tienes autorización para realizar esta acción.",
  "tool.upload_model.folder_error": "No se ha encontrado la carpeta para el procedimiento seleccionado",
  "tool.upload_model.upload_warning_success": name => `Modelo guardado con algunas alertas. Pulsa sobre el siguiente enlace para copiarlo y poder pegarlo en el formulario de tramitación:\n\n${name}`,
  "tool.upload_model.upload_success": name => `Modelo guardado. Pulsa sobre el siguiente enlace para copiarlo y poder pegarlo en el formulario de tramitación:\n\n${name}`,
  "tool.upload_model.upload_error": "No se ha podido subir el modelo.",
  "tool.upload_model.authentication_error": "Error de autenticación: Verifica el usuario y contraseña.",
  "tool.upload_model.validation_warning": "Ten en cuenta que la herramienta te permite validar considerando los cambios realizados desde la importación. En cambio, si se procede con el guardado, el modelo que se guarde no va a incluir dichos cambios.",
  "tool.upload_model.verifying_project": "Verificando proyecto...",
  "tool.upload_model.uploading_model": "Subiendo modelo...",
  "tool.upload_model.create_project_error": "Se ha subido el modelo pero no se han podido crear los metadatos del proyecto.",
  "tool.upload_model.update_version_error": "Se ha subido la nueva versión del modelo pero no se han podido actualizar los metadatos del proyecto.",

  "message.upload_model.credentials_required": "Esta acción requiere autenticación",
  "message.upload_model.upload_phase_error" : "En la fase que se encuentra el proyecto no se permite subir nuevas versiones",
  "message.upload_model.project_in_other_tramit": tramit => `Este ID de proyecto ya está asociado al trámite ${tramit} y no puede estar en más de un trámite.`,
  "message.upload_model.path_copy_title" : "Copiar ruta",
  "message.upload_model.path_copied" : "Ruta del archivo copiada al portapapeles",
  "message.upload_model.select_plant": "Selecciona el subprocedimiento",
  "message.upload_model.select_zone": "Selecciona la zona",
  "question.delete_folder_project_directory": name => `¿Quieres eliminar el directorio de proyecto ${name}? También se eliminarán sus subdirectorios y ficheros.`,

  "title.path_copy" : "Copiar ruta",

  // SelectByView
  "tool.select_by_view.label": "Visualización por Área",
  "tool.select_by_view.help": "Visualización por Área",
  "tool.select_by_view.select_view": "Selecciona área",
  "tool.select_by_view.select_option": "Selecciona área",
  "tool.select_by_view.validation_model_error" : "No has abierto ningún modelo IFC",
  "tool.select_by_view.validation_option_error" : "No has seleccionado ninguna opción",
  "tool.select_by_view.validation_view_error": "No se ha encontrado el área para la opción seleccionada",
  "tool.select_by_view.validation_output_error" : "La área seleccionada no es válida",
  "tool.select_by_view.validation_success" : "La vista es válida",
  "tool.select_by_view.script_load_error": "Error, no se ha podido cargar la vista",
  "tool.select_by_view.script_execution_error": "Error, no se ha podido ejecutar la vista",

  // BCF
  "label.review_status_change": "Cambio de estado de revisión",
  "label.project_tracking": "Seguimiento de proyecto",
  "label.final_save": "Guardado definitivo",

  "button.start_internal_petitions": "Inicio peticiones internas",
  "button.end_internal_petitions": "Fin peticiones internas",
  "button.init_requirement": "Inicio requerimiento",
  "button.end_requirement": "Fin requerimiento",
  "button.init_public_phase": "Fase pública",
  "button.end_preproject_start_basic": "Fin anteproyecto - inicio básico",
  "button.end_basic_start_executive": "Fin básico - inicio ejecutivo",
  "button.end_executive": "Fin ejecutivo",
  "button.save_model_to_db": "Resolución",
  "button.project_status": "Estado de proyecto",
  "button.open_checklist_topic": "Abrir lista",
  "button.open_checklist_topic_unavailable": "Sin checklist asociado",

  "message.bcf_no_pv_projects": "No se han encontrado modelos cargados",
  "message.bcf_only_v_projects": "Algunos proyectos cargados en el visor aun no han sido guardados en el repositorio, por lo que no pueden utilizar el sistema BCF hasta que lo estén",
  "message.extensions_start_internal": "Las peticiones internas se han iniciado correctamente.",
  "message.extensions_end_internal": "Las peticiones internas han finalizado correctamente.",
  "message.extensions_init_requirement": "El requerimiento se ha iniciado correctamente.",
  "message.extensions_end_requirement": "El requerimiento ha finalizado correctamente.",
  "message.extensions_start_public_phase": "La fase pública se ha iniciado correctamente.",
  "message.extensions_end_preproject_start_basic": "Se ha finalizado el anteproyecto y se ha iniciado la fase básica correctamente.",
  "message.extensions_end_basic_start_executive": "Se ha finalizado la fase básica y se ha iniciado la fase ejecutiva correctamente.",
  "message.extensions_end_executive": "La fase ejecutiva ha finalizado correctamente.",
  "message.phase_error": "Se ha producido un error.",
  "message.phase_requirements_missing": "No se permite el cambio de fase. Faltan validaciones obligatorias.",
  "message.model_saved_to_db": "El modelo ha sido guardado correctamente en la base de datos.",
  "message.model_saved_to_db_error": "Se ha producido un error al guardar el modelo en la base de datos.",
  "message.project_status_loading": "Cargando resumen del estado del proyecto...",
  "message.project_status_no_project": "Selecciona un proyecto para consultar su estado.",
  "message.project_status_no_checklist": "No se ha encontrado un checklist asociado a la fase actual.",
  "message.project_status_no_checks_marked": "(ninguno marcado)",
  "message.project_status_no_checklist_tooltip": "No se puede abrir un checklist porque no existe ninguno asociado a la fase actual del proyecto.",
  "message.project_status_unknown_phase": "Fase desconocida",
  "message.project_status_error": "No se ha podido cargar el resumen del estado del proyecto.",

  "title.project_status_summary": "Resumen de estado",
  "label.project_procedure_name": "Nombre del trámite",
  "label.project_phase": "Fase actual",
  "label.project_current_status": "Estado actual",
  "label.project_record": "Expediente",
  "label.project_folder": "Carpeta del proyecto",
  "label.project_current_version": "Versión actual",
  "label.project_company": "Empresa",
  "label.project_author": "Autor",
  "label.project_current_checklist_progress": "Progreso de la lista actual",
  "label.project_checklist_recommended": "Checklist recomendado",
  "label.phase_preproject": "Anteproyecto",
  "label.phase_basic": "Básico",
  "label.phase_executive": "Ejecutivo",

  "tool.bcf.button.connect": "Refrescar",

  "tab.checklist": "Checklist",

  // GIS
  "button.update": "Actualizar",

  "tool.gis.label": "Capas de información geográfica",
  "tool.gis.help": "Muestra capas de servicios de información geográfica (WMS)",
  "tool.gis.select_process": "Selecciona el tipo de procedimiento",
  "tool.gis.select_option": "Selecciona el procedimiento",
  "tool.gis.validation_option_error": "No has seleccionado ninguna opción",
  "tool.gis.validation_model_error": "No has abierto ningún modelo IFC",

};
