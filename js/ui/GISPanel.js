/**
 * GISPanel.js
 * i2CAT
 */

import { Panel } from "platform/ui/panel/Panel.js";
import { Tree } from "platform/ui/tree/Tree.js";
import { GISUtils } from "../utils/GISUtils.js";
import { Controls } from "platform/ui/Controls.js";
import { MessageDialog } from "platform/ui/dialog/MessageDialog.js";
import { I18N } from "platform/i18n/I18N.js";

class GISPanel extends Panel
{
  constructor(application, tool)
  {
    super(application);

    this.id = tool.name;
    this.title = tool.label;
    this.tool = tool;
    this.position = "right";
    this.map = new Map();
    this.autoScroll = true;
    this.currentTramitId = null;

    this.defaultHeight = 200;
    this.defaultMobileHeight = 200;
    this.minimumHeight = 200;

    this.loadedLayers = new Map();

    this.addGISLayerStyles();

    this.application.addEventListener("scene", (event) =>
    {
      if (event.type === "removed")
      {
        this.handleObjectRemoved(event.object);
      }
    });

    this.createProcedureSelector();

    this.treeContainer = document.createElement("div");
    this.treeContainer.style.flex = "1";
    this.bodyElem.appendChild(this.treeContainer);

    this.tree = new Tree(this.treeContainer);
    this.tree.rootsElem.className = "tree outliner-gis";

    this.tree.getNodeLabel = (object) =>
    {
      let objectLabel = object.name;
      if (!objectLabel || objectLabel.trim().length === 0)
      {
        objectLabel = object.id || object.url || "Unnamed Layer";
      }
      return objectLabel;
    };
  }

  createProcedureSelector()
  {
    const procedureRulesConfig = this.application.default_properties?.getGISLayers() ?? {};
    const procedures = Object.entries(procedureRulesConfig).map(([id]) => ({
      id,
    }));

    this.tramitContainer = document.createElement("div");
    this.tramitContainer.className = "tramit-selector";
    this.tramitContainer.style.paddingBottom = "10px";
    this.tramitContainer.style.borderBottom = "1px solid #ddd";

    this.helpElem = document.createElement("div");
    I18N.set(this.helpElem, "textContent", "i2cat|tool.gis.select_process");
    this.helpElem.style.margin = "4px";
    this.tramitContainer.appendChild(this.helpElem);

    this.procedureSelect = document.createElement("select");
    this.procedureSelect.id = "tramits";
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    I18N.set(emptyOption, "textContent", "i2cat|tool.gis.select_option");
    this.procedureSelect.appendChild(emptyOption);

    procedures.forEach((procedure) =>
    {
      const option = document.createElement("option");
      option.value = procedure.id;
      option.textContent = procedure.id;
      this.procedureSelect.appendChild(option);
    });

    this.tramitContainer.appendChild(this.procedureSelect);

    Controls.addButton(this.tramitContainer,
      "gis_update_layers", "i2cat|button.update", () =>
      {
        const selectedId = this.procedureSelect.value;
        if (!selectedId)
        {
          MessageDialog.create("ERROR", "i2cat|tool.gis.validation_option_error", "error")
            .setClassName("error")
            .setI18N(this.application.i18n).show();
          return;
        }

        this.currentTramitId = selectedId;
        this.update();
      });

    this.bodyElem.appendChild(this.tramitContainer);

  }

  addGISLayerStyles()
  {
    const style = document.createElement("style");
    style.textContent = `
      ul.tree.outliner-gis li.collapsed > button {
        margin-left: 5px;
      }
      
      ul.tree.outliner-gis li.expanded > button {
        margin-left: 5px;
      }

      ul.tree.outliner-gis li {
        background-image: none;
      }

      ul.tree.outliner-gis li > div {
        margin-left: 3px;
      }
      
    `;
    document.head.appendChild(style);
  }

  update()
  {
    if (!this.currentTramitId)
    {
      console.warn("Cap tràmit seleccionat. No es carreguen capes.");
      return;
    }

    for (let layerObject of this.loadedLayers.values())
    {
      this.application.removeObject(layerObject);
    }

    this.loadedLayers.clear();
    this.tree.clear();
    this.map.clear();

    const gisConfig = this.application.default_properties.getGISLayers(this.currentTramitId);
    const layers = gisConfig?.layers;
    if (!layers || layers.length === 0)
    {
      console.warn("No hi ha capes definides per al tràmit:", this.currentTramitId);
      return;
    }

    layers.forEach((layerGroup) =>
    {
      if (layerGroup.visible === undefined) layerGroup.visible = true;
      const groupNode = this.populateObject(layerGroup, null);
      this.createMap(groupNode);
    });
  }

  updateSelection()
  {
    this.clearNodeStyle("selected");

    const selection = this.application.selection;
    const objects = selection.objects;
    const lastObject = objects[objects.length - 1];
    for (let object of objects)
    {
      let treeNode = this.map.get(object);
      if (treeNode)
      {
        treeNode.addClass("selected");
        let makeVisible = object === lastObject && this.autoScroll;
        treeNode.expandAncestors(makeVisible);
      }
    }
    this.bodyElem.scrollLeft = 0;
    this.autoScroll = true;
  }

  hasIfcValidation()
  {
    const baseChildren = this.application.baseObject.children;
    if (baseChildren.length > 0)
    {
      this.modelObject = baseChildren[0];
      if (this.modelObject.userData.IFC?.GlobalId)
      {
        return true;
      }
    }
    MessageDialog.create("ERROR", "i2cat|tool.gis.validation_model_error", "error")
      .setClassName("error")
      .setI18N(this.application.i18n).show();
    return false;
  }


  updateLayerVisibility(object, shouldLoad)
  {
    let treeNode = this.map.get(object);

    if (!treeNode) return;

    const layerName = object.typeName;
    const isAlreadyLoaded = this.loadedLayers.has(layerName);
    if (shouldLoad)
    {
      if (isAlreadyLoaded)
      {
        return;
      }
      if (!this.hasIfcValidation())
      {
        const checkbox = treeNode.itemElem.querySelector("input[type='checkbox']");
        if (checkbox)
        {
          checkbox.checked = false;
        }
        return;
      }

      if (layerName)
      {
        let layerObject;
        if (object.type == "wfs")
        {
          const layerColor = object.colorExpression ? object.colorExpression : "`" + object.color + "`";
          layerObject = GISUtils.addWfsLayer(this.application, object.url, layerName, object.bufferSize, 0.01, layerColor, true,
            object.layerType, object.roadWidth, 0.001, object.srsName, object.format, object.version);
        }
        else if (object.type == "wms")
        {
          layerObject = GISUtils.addMapViewLayer(this.application, "WMSProvider", object.mapMode, object.url, layerName, object.utmZoneNumber,
            object.utmZoneLetter, object.format, object.transparent);
        }
        if (layerObject !== undefined)
        {
          this.loadedLayers.set(layerName, layerObject);
        }
      }
      object.visible = true;
      this.updateNodeStyle(treeNode);
    }
    else
    {
      if (isAlreadyLoaded)
      {
        if (this.application.baseObject.children && Array.isArray(this.application.baseObject.children))
        {
          const objectsToRemove = this.application.baseObject.children.filter(obj => obj.name === layerName);

          for (const obj of objectsToRemove)
          {
            this.application.removeObject(obj);
          }
        }

        this.loadedLayers.delete(layerName);
      }
      this.updateNodeStyle(treeNode);
    }
  }

  populateObject(object, parentTreeNode)
  {
    const setChildrenCheckboxes = (obj, checked) =>
    {
      if (obj.children && Array.isArray(obj.children))
      {
        for (let child of obj.children)
        {
          const childTreeNode = this.map.get(child);
          if (childTreeNode)
          {
            const childCheckbox = childTreeNode.itemElem.querySelector("input[type='checkbox']");
            if (childCheckbox)
            {
              childCheckbox.checked = checked;
              this.updateLayerVisibility(child, checked);
            }
          }
          setChildrenCheckboxes(child, checked);
        }
      }

    };
    const updateParentCheckboxes = (obj) =>
    {
      const treeNode = this.map.get(obj);
      if (!treeNode || !treeNode.parent) return;

      const parentObject = treeNode.parent.value;
      const parentTreeNode = this.map.get(parentObject);
      if (!parentTreeNode) return;

      const parentCheckbox = parentTreeNode.itemElem.querySelector("input[type='checkbox']");
      if (!parentCheckbox) return;

      const allChildrenChecked = parentObject.children.every(child =>
      {
        const childNode = this.map.get(child);
        const childCheckbox = childNode?.itemElem.querySelector("input[type='checkbox']");
        return childCheckbox?.checked;
      });

      parentCheckbox.checked = allChildrenChecked;
      this.updateLayerVisibility(parentObject, allChildrenChecked);

      updateParentCheckboxes(parentObject);
    };

    const createControlContainer = (object) =>
    {
      const controlContainer = document.createElement("span");
      controlContainer.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-right: 6px;
        vertical-align: middle;
      `;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.style.margin = "0";
      checkbox.checked = false;
      checkbox.name = object.name;
      controlContainer.appendChild(checkbox);

      if (object.color)
      {
        if (typeof object.color === "object" && !Array.isArray(object.color))
        {
          Object.entries(object.color).forEach(([name, colorValue]) =>
          {
            const colorSpan = document.createElement("span");
            colorSpan.style.cssText = `
              display: inline-block;
              width: 12px;
              height: 12px;
              border-radius: 2px;
              background: ${colorValue};
              border: 1px solid #ccc;
              margin-right: 3px;
            `;
            colorSpan.title = name;
            controlContainer.appendChild(colorSpan);
          });
        }
        else
        {
          const colorSpan = document.createElement("span");
          colorSpan.style.cssText = `
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 2px;
            background: ${object.color};
            border: 1px solid #ccc;
            margin-right: 3px;
          `;
          colorSpan.title = object.name;
          controlContainer.appendChild(colorSpan);
        }
      }

      return { controlContainer, checkbox };
    };

    const onClick = (event) =>
    {
      if (event?.target === checkbox)
      {
        return;
      }
      this.autoScroll = false;
      checkbox.checked = !checkbox.checked;
      this.updateLayerVisibility(object, checkbox.checked);
      setChildrenCheckboxes(object, checkbox.checked);
      updateParentCheckboxes(object);
    };

    const className = this.getNodeClassName(object);
    const treeNode = parentTreeNode
      ? parentTreeNode.addNode(object, onClick, className)
      : this.tree.addNode(object, onClick, className);

    const { controlContainer, checkbox } = createControlContainer(object);
    treeNode.nodeElem.insertBefore(controlContainer, treeNode.nodeElem.firstChild);

    checkbox.addEventListener("change", (event) =>
    {
      event.stopPropagation();
      const isChecked = event.target.checked;
      this.updateLayerVisibility(object, isChecked);
      setChildrenCheckboxes(object, isChecked);
      updateParentCheckboxes(object);
    });

    this.map.set(object, treeNode);
    this.updateNodeStyle(treeNode);

    if (object.children && Array.isArray(object.children) && object.children.length > 0)
    {
      this.populateChildren(treeNode);
    }

    return treeNode;
  }

  getNodeClassName(object)
  {
    const classes = [];
    if (object.children && object.children.length > 0)
    {
      classes.push("group-node");
    }
    return classes.join(" ");
  }

  populateChildren(treeNode)
  {
    let object = treeNode.value;
    for (let child of object.children)
    {
      this.populateObject(child, treeNode);
    }
  }

  handleObjectRemoved(object)
  {
    let treeNode = null;
    const objectName = object.name;

    for (let [mapObject, mapTreeNode] of this.map.entries())
    {
      if (mapObject.typeName === objectName || mapObject.name === objectName)
      {
        treeNode = mapTreeNode;
        break;
      }
    }

    if (treeNode)
    {
      const checkbox = treeNode.itemElem?.querySelector("input[type='checkbox']");
      if (checkbox)
      {
        checkbox.checked = false;
      }
    }
    const layerName = object.name;
    if (layerName && this.loadedLayers.has(layerName))
    {
      this.loadedLayers.delete(layerName);
    }
  }

  updateNodeStyle(treeNode)
  {
    const object = treeNode.value;

    if (object.visible === false)
    {
      treeNode.addClass("invisible");
    }
    else
    {
      treeNode.removeClass("invisible");
    }

    let expanded = treeNode.isExpanded();

    if (expanded)
    {
      treeNode.expand();
    }
    else
    {
      treeNode.collapse();
    }
  }

  clearNodeStyle(className)
  {
    let nodes = this.tree.rootsElem.getElementsByClassName(className);
    nodes = [...nodes];
    for (let node of nodes)
    {
      node.classList.remove(className);
    }
  }

  createMap(treeNode)
  {
    for (let childTreeNode of treeNode.children)
    {
      this.createMap(childTreeNode);
    }
  }

  destroyMap(treeNode)
  {
    this.map.delete(treeNode.value);
    for (let childTreeNode of treeNode.children)
    {
      this.destroyMap(childTreeNode);
    }
  } 

  resetInputOptions()
  {
    this.currentTramitId = null;
    if (this.procedureSelect)
    {
      this.procedureSelect.value = "";
    }

    if (this.tree)
    {
      this.tree.clear();
    }
    this.map.clear();

    this.loadedLayers.clear();
    this.modelObject = null;
  }
}

export { GISPanel };
