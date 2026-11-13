/**
 * GISUtils.js
 *
 */

import { WFSController } from "modules/gis/controllers/WFSController.js";
import { MapViewController } from "modules/gis/controllers/MapViewController.js";
import { Extruder } from "platform/builders/Extruder.js";
import { Solid } from "platform/core/Solid.js";
import { Environment } from "environment";
import { MessageDialog } from "platform/ui/dialog/MessageDialog.js";
import { Formula } from "platform/formula/Formula.js";
import * as THREE from "three";
import { TubeBuilder } from "platform/builders/TubeBuilder.js";

THREE.ColorManagement.enabled = true;

class GISUtils
{
  static addWfsLayer(application, url, layerName, bufferSize = 10000, depth = 0.01, colorExpression = "#f0f0f0", showEdges = true,
    layerType = "POLYGON", roadWidth = 6, zscale = 0.001, srsName, format = "GeoJSON", version)
  {

    let sites = application.findObjects($ => $("IFC", "ifcClassName") === "IfcSite");
    if (sites.length > 0)
    {
      let site = sites[0];
      let project = site.parent;
      let center = new THREE.Vector3(0, 0, 0);
      center.applyMatrix4(site.matrix).applyMatrix4(project.matrix);

      let layerGroup = new THREE.Group();
      layerGroup.position.z = center.z;
      layerGroup.name = layerName;
      application.addObject(layerGroup, application.baseObject);

      let controller = application.createController(WFSController, layerGroup);
      controller.layer = layerName;
      controller.mergeGeometries = false;
      controller.url = Environment.SERVER_URL + "/api/proxy?url="+url;
      controller.username = "";
      controller.password = "";
      if (controller.version !== "" && controller.version !== undefined)
      {
        controller.version = version;
      }
      controller.format = format;
      if (srsName !== "" && srsName !== undefined)
      {
        controller.srsName = srsName; //IMORTANT: defines the Zone which we want to use for response objects' coordinates
        controller.bbox = [center.x - bufferSize, center.y - bufferSize, center.x + bufferSize, center.y + bufferSize].join(",");
        controller.bbox = controller.bbox + "," + srsName; //IMPORTANT: defines the Zone wich we are passing the bbox coordinates
      }
      else
      {
        controller.bbox = [center.x - bufferSize, center.y - bufferSize, center.x + bufferSize, center.y + bufferSize].join(",");
      }
      controller.autoStart = true;

      controller.representationMode = 0;
      let repr = new Solid();
      repr.name = "representation";
      repr.edgesVisible = showEdges;
      Formula.create(repr, "material",
        `new THREE.MeshBasicMaterial({ color: ${colorExpression}})`, false);
      repr.builder = new Extruder();

      if (layerType =="STRING-LINE")
      {
        repr.builder = new TubeBuilder (roadWidth, zscale);
      }
      else
      {
        repr.builder = new Extruder();
      }

      if (typeof depth === "number")
      {
        repr.builder.depth = depth;
      }
      else if (typeof depth === "string")
      {
        Formula.create(repr, "builder.depth", depth, false);
      }
      application.addObject(repr, layerGroup);

      controller.start();
      return layerGroup;
    }
    else
    {
      MessageDialog.create("ERROR", "No s'ha trobat cap projecte IFC.", "error")
        .setClassName("error")
        .setI18N(application.i18n).show();
      return null;
    }
  }

  static addMapViewLayer(application, provider="WMSProvider", mapMode="PLANAR", url, layerName, utmZoneNumber=31, utmZoneLetter="N", format = "image/png", transparent=false)
  {
    let sites = application.findObjects($ => $("IFC", "ifcClassName") === "IfcSite");
    if (sites.length > 0)
    {
      let site = sites[0];
      let project = site.parent;
      let center = new THREE.Vector3(0, 0, 0);
      center.applyMatrix4(site.matrix).applyMatrix4(project.matrix);

      let layerGroup = new THREE.Group();
      layerGroup.name = layerName;
      application.addObject(layerGroup, application.baseObject);
      let controller = application.createController(MapViewController, layerGroup);

      controller.zOffset = center.z;
      controller.mapMode = mapMode;
      controller.utmZoneNumber = utmZoneNumber;
      controller.utmZoneLetter = utmZoneLetter;
      controller.start();
      controller.autoStart = false;

      const setupKey = controller.name + "_"+ provider;
      let urlBase = "";

      function esUrlRelativa(url)
      {
        try
        {
          new URL(url);
          return false;
        }
        catch (e)
        {
          return true;
        }
      }

      if (esUrlRelativa(Environment.SERVER_URL))
      {
        urlBase = window.location.origin + Environment.SERVER_URL
      } 
      else 
      {
        urlBase = Environment.SERVER_URL;
      }
      
      controller.object.userData[setupKey] = {
        baseUrl: urlBase + "/api/proxy?url="+url,
        layers: layerName,
        format: format,
        transparent: transparent,
      };
      controller.provider = provider;
      controller.updateMap();
      return layerGroup;
    }
    else
    {
      MessageDialog.create("ERROR", "No s'ha trobat cap projecte IFC.", "error")
        .setClassName("error")
        .setI18N(application.i18n).show();
      return null;
    }
  }
}

window.GISUtils = GISUtils;

export { GISUtils };
