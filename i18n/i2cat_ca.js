/**
 * i2cat_ca.js
 *
 */

export const translations =
{
  // SeguimentProjecte
  "tool.seguiment_projecte.label" : "Copy Seguiment de projecte",
  "tool.seguiment_projecte.help" : "Seguiment de projecte",

  "action.upload_folder" : "Puja carpeta",

  "message.folder_uploaded" : "Carpeta pujada.",
  "message.upload_folder_not_supported" : "La pujada de carpetes només està disponible en navegadors basats en Chromium.",
  "message.folder_already_exists" : name => `La carpeta ${name} ja existeix a la destinació.`,
  "message.folder_not_deleted" : "La carpeta no s'ha esborrat.",

  // Processing Permits
  "tool.processing_permits.label": "Llicències / autoritzacions (en tràmit)",
  "tool.processing_permits.help" : "Llicències / autoritzacions (en tràmit)",

  // Tasks
  "tool.task.label": "Tasques",

  "action.new_task" : "Tasca",
  "action.run_task" : "Executa tasca",
  "action.edit_task" : "Edita tasca",

  // UploadModel
  "button.validate" : "Valida",

  "tool.upload_model.label" : "Valida i desa el model",
  "tool.upload_model.help" : "Valida i desa el model",
  "tool.upload_model.select_process" : "Selecciona el tipus de procediment",
  "tool.upload_model.select_option" : "Selecciona el procediment",
  "tool.upload_model.validation_model_error" : "No has obert cap model IFC",
  "tool.upload_model.validation_option_error" : "No has seleccionat cap opció",
  "tool.upload_model.validation_rule_error" : "No s'ha trobat la regla per l'opció seleccionada",
  "tool.upload_model.validation_warning_success": warnings => `El model ha passat la validació amb ${warnings} alertes. Ja pots enviar el model`,
  "tool.upload_model.validation_output_error" : "El model té errors. Hauràs de corregir-los abans d'enviar-lo",
  "tool.upload_model.validation_success" : "El model ha passat la validació. Ja pots enviar el model",
  "tool.upload_model.validation_service_error": "No tens autorització per a dur a terme aquesta acció.",
  "tool.upload_model.folder_error": "No s'ha trobat la carpeta per al procediment seleccionat",
  "tool.upload_model.upload_warning_success": name => `Model desat amb algunes alertes. Clica sobre el següent enllaç per copiar-lo i poder-lo enganxar en el formulari de tramitació:\n\n${name}`,
  "tool.upload_model.upload_success": name => `Model desat. Clica sobre el següent enllaç per copiar-lo i poder-lo enganxar en el formulari de tramitació:\n\n${name}`,
  "tool.upload_model.upload_error": "No s'ha pogut pujar el model.",
  "tool.upload_model.authentication_error": "Error d'autenticació: Verifiqueu el vostre usuari i contrasenya.",
  "tool.upload_model.validation_warning": "Tingues en compte que l'eina et permet validar considerant els canvis realitzats des de l'importació. En canvi, si es procedeix amb el desat, el model desat no inclourà aquests canvis.",
  "tool.upload_model.verifying_project": "Verificant projecte...",
  "tool.upload_model.uploading_model": "Pujant model...",
  "tool.upload_model.create_project_error": "S'ha pujat el model però no s'han pogut crear metadades del projecte.",
  "tool.upload_model.update_version_error": "S'ha pujat la nova versió del model però no s'han pogut actualitzar les metadades del projecte.",

  "message.upload_model.credentials_required": "Aquesta acció requereix autenticació",
  "message.upload_model.upload_phase_error" : "A la fase que es troba el projecte no es permet pujar noves versions",
  "message.upload_model.project_in_other_tramit": tramit => `Aquest ID de projecte ja està associat al tràmit ${tramit} i no pot estar en més d'un tràmit.`,
  "message.upload_model.path_copy_title" : "Copiar ruta",
  "message.upload_model.path_copied" : "Ruta del fitxer copiada al porta-retalls",
  "message.upload_model.select_plant": "Selecciona el subprocediment",
  "message.upload_model.select_zone": "Selecciona la zona",
  "question.delete_folder_project_directory": name => `Vols eliminar el directori de projecte ${name}? També s'eliminaran els seus subdirectoris i fitxers.`,

  "title.path_copy" : "Copiar ruta",

  // SelectByView
  "tool.select_by_view.label" : "Visualització per Àrea",
  "tool.select_by_view.help" : "Visualització per Àrea",
  "tool.select_by_view.select_view" : "Selecciona àrea",
  "tool.select_by_view.select_option" : "Selecciona àrea",
  "tool.select_by_view.validation_model_error" : "No has obert cap model IFC",
  "tool.select_by_view.validation_option_error" : "No has seleccionat cap opció",
  "tool.select_by_view.validation_view_error" : "No s'ha trobat l'àrea' per l'opció seleccionada",
  "tool.select_by_view.validation_output_error" : "L'àrea seleccionada no és vàlida",
  "tool.select_by_view.validation_success" : "El model ha passat la validació. Ja pots enviar el model",
  "tool.select_by_view.script_load_error": "Error, no s'ha pogut carregar la vista",
  "tool.select_by_view.script_execution_error": "Error, no s'ha executat la vista",

  // BCF
  "label.review_status_change": "Canvi d'estat de revisió",
  "label.project_tracking": "Seguiment de projecte",
  "label.final_save": "Desat definitiu",

  "button.start_internal_petitions": "Inici peticions internes",
  "button.end_internal_petitions": "Fi peticions internes",
  "button.init_requirement": "Inici requeriment",
  "button.end_requirement": "Fi requeriment",
  "button.init_public_phase": "Fase pública",
  "button.end_preproject_start_basic": "Fi avantprojecte - inici bàsic",
  "button.end_basic_start_executive": "Fi bàsic - inici executiu",
  "button.end_executive": "Fi executiu",
  "button.save_model_to_db": "Resolució",
  "button.project_status": "Estat del projecte",
  "button.open_checklist_topic": "Obrir llista",
  "button.open_checklist_topic_unavailable": "Sense checklist associat",

  "message.bcf_no_pv_projects": "No s'han trobat models carregats",
  "message.bcf_only_v_projects": "Alguns projectes carregats al visor encara no han estat guardats al repositori, per la qual cosa no poden utilitzar el sistema BCF fins que ho estiguin",
  "message.extensions_start_internal": "Les peticions internes s'han iniciat correctament.",
  "message.extensions_end_internal": "Les peticions internes han finalitzat correctament.",
  "message.extensions_init_requirement": "El requeriment s'ha iniciat correctament.",
  "message.extensions_end_requirement": "El requeriment ha finalitzat correctament.",
  "message.extensions_start_public_phase": "La fase pública s'ha iniciat correctament.",
  "message.extensions_end_preproject_start_basic": "S'ha finalitzat l'avantprojecte i s'ha iniciat la fase bàsica correctament.",
  "message.extensions_end_basic_start_executive": "S'ha finalitzat la fase bàsica i s'ha iniciat la fase executiva correctament.",
  "message.extensions_end_executive": "La fase executiva ha finalitzat correctament.",
  "message.phase_error": "S'ha produït un error.",
  "message.phase_requirements_missing": "No es permet el canvi de fase. Falten validacions obligatories.",
  "message.model_saved_to_db": "El model ha estat desat correctament a la base de dades.",
  "message.model_saved_to_db_error": "S'ha produït un error en desar el model a la base de dades.",
  "message.project_status_loading": "Carregant resum d'estat del projecte...",
  "message.project_status_no_project": "Selecciona un projecte per consultar-ne l'estat.",
  "message.project_status_no_checklist": "No s'ha trobat cap checklist associat a la fase actual.",
  "message.project_status_no_checks_marked": "(cap marcat)",
  "message.project_status_no_checklist_tooltip": "No es pot obrir cap checklist perquè no n'hi ha cap d'associat a la fase actual del projecte.",
  "message.project_status_unknown_phase": "Fase desconeguda",
  "message.project_status_error": "No s'ha pogut carregar el resum de l'estat del projecte.",

  "title.project_status_summary": "Estat del projecte",
  "label.project_procedure_name": "Nom del tràmit",
  "label.project_phase": "Fase actual",
  "label.project_current_status": "Estat actual",
  "label.project_record": "Expedient",
  "label.project_folder": "Carpeta del projecte",
  "label.project_current_version": "Versió actual",
  "label.project_company": "Empresa",
  "label.project_author": "Autor",
  "label.project_current_checklist_progress": "Progrés de la llista actual",
  "label.project_checklist_recommended": "Checklist recomanat",
  "label.phase_preproject": "Avantprojecte",
  "label.phase_basic": "Basic",
  "label.phase_executive": "Executiu",
  "label.phase_finalized": "Preparació de l'obra",

  "tool.bcf.button.connect": "Refrescar",

  "tab.checklist": "Checklist",

  // GIS
  "button.update" : "Actualitza",

  "tool.gis.label" : "Capes d’info. geogràfica",
  "tool.gis.help" : "Mostra capes de serveis d'informació geogràfica (WMS)",
  "tool.gis.select_process" : "Selecciona el tipus de procediment",
  "tool.gis.select_option" : "Selecciona el  procediment",
  "tool.gis.validation_option_error" : "No has seleccionat cap opció",
  "tool.gis.validation_model_error" : "No has obert cap model IFC",

};
