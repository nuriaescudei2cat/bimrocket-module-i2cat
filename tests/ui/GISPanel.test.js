/*
 * GISPanel.test.js
 *
 * Unit tests for GISPanel.js
 *
 */

/**
 * @jest-environment jsdom
 */

import { GISPanel } from "../../js/ui/GISPanel.js";
import { GISUtils } from "../../js/utils/GISUtils.js";
import { MessageDialog } from "../../../../platform/ui/dialog/MessageDialog.js";
import { Controls } from "../../../../platform/ui/Controls.js";

global.bimrocket = {
  i18n: {}
};

function mockTreeInstance() {
  return {
    rootsElem: document.createElement("ul"),
    addNode: jest.fn((value) => {
      const itemElem = document.createElement("li");
      const nodeElem = document.createElement("div");
      itemElem.appendChild(nodeElem);
      return {
        value,
        itemElem,
        nodeElem,
        children: [],
        addClass: jest.fn(),
        removeClass: jest.fn(),
        expand: jest.fn(),
        collapse: jest.fn(),
        isExpanded: jest.fn(() => false),
        expandAncestors: jest.fn(),
        parent: null 
      }
    }),
    clear: jest.fn()
  };
}

jest.mock("../../../../platform/ui/tree/Tree.js", () => ({
  Tree: jest.fn().mockImplementation(() => mockTreeInstance())
}));

jest.mock("../../js/utils/GISUtils.js", () => ({
  GISUtils: {
    addWfsLayer: jest.fn(() => ({ layer: true })),
    addMapViewLayer: jest.fn(() => ({ layer: true }))
  }
}));

let mockButtonCallback = null;
jest.mock("../../../../platform/ui/Controls.js", () => ({
  Controls: {
    addIcon: jest.fn(),
    addButton: jest.fn((parent, id, label, callback) => {
      if (id === "gis_update_layers") {
        mockButtonCallback = callback;
      }
      const btn = global.document.createElement("button"); 
      btn.id = id;
      btn.onclick = callback;
      if (parent && parent.appendChild) {
        parent.appendChild(btn);
      }
      return btn;
    }),

    addTextWithArgs: jest.fn((parent, text, args, className) => {
      const span = global.document.createElement("span");
      span.className = className || "";
      span.textContent = text;
      if (parent && parent.appendChild) {
        parent.appendChild(span);
      }
      return span;
    })
  },
}));

jest.mock("../../../../platform/i18n/I18N.js", () => ({
  I18N: { set: jest.fn() }
}));

const mockDialogInstance = {
  setClassName: jest.fn().mockReturnThis(),
  setI18N: jest.fn().mockReturnThis(),
  show: jest.fn().mockReturnThis()
};

jest.mock("../../../../platform/ui/dialog/MessageDialog.js", () => ({
  MessageDialog: {
    create: jest.fn(() => ({
      setClassName: jest.fn().mockReturnThis(),
      setI18N: jest.fn().mockReturnThis(),
      show: jest.fn().mockReturnThis()
    }))
  }
}));

function createMockApp() {
  return {
    setup: {
      panelOpacity: 1.0 
    },
    default_properties: {
      getProceduresConfig: jest.fn(() => ({})),
      getGISLayers: jest.fn(() => ({ layers: [] }))
    },
    addEventListener: jest.fn(),
    baseObject: { children: [] },
    selection: { objects: [] },
    removeObject: jest.fn(),
    i18n: {
      get: jest.fn(key => key),
      update: jest.fn(),
      updateTree: jest.fn()
    } 
  };
}

describe("GISPanel Tests", () => {
  let app;
  let panel;

  beforeEach(() => {
    app = createMockApp();
    panel = new GISPanel(app, { name: "gis", label: "GIS" });
    jest.clearAllMocks();
  });

  // --- createProcedureSelector / Controls.addButton ---
  // test("createProcedureSelector: creates the procedure selector with options", () => {
  //   const mockTramits = {
  //     PROCEDURE_RULES: {
  //       "t1": { name: "Tramit 1" },
  //       "t2": { name: "Tramit 2" }
  //     }
  //   };
  //   app.default_properties.getProceduresConfig.mockReturnValue(mockTramits);
    
  //   const newPanel = new GISPanel(app); 
    
  //   const select = newPanel.procedureSelect;
  //   expect(select.children.length).toBe(3); 
  //   expect(select.children[1].value).toBe("t1");
  //   expect(select.children[1].textContent).toBe("Tramit 1");
  // });

  test("Controls.addButton callback: mostra error si no hi ha tràmit seleccionat", () => {
    panel.update = jest.fn();
    panel.procedureSelect.value = ""; 

    if (typeof mockButtonCallback === "function") {
      mockButtonCallback();
    }
    
    expect(panel.currentTramitId).toBeNull();
    expect(panel.update).not.toHaveBeenCalled();
    expect(MessageDialog.create).toHaveBeenCalledWith(
      "ERROR", 
      "i2cat|tool.gis.validation_option_error", 
      "error"
    );
  });

  // --- update() ---
  test("update(): Clears the tree and the maps before loading.", () => {
    panel.currentTramitId = "test_id";
    panel.map.set("dummy", {});
    panel.loadedLayers.set("dummy", {});

    panel.update();

    expect(panel.tree.clear).toHaveBeenCalled();
    expect(panel.map.size).toBe(0);
    expect(panel.loadedLayers.size).toBe(0);
  });

  test("update(): Does not load layers and shows a warning if getGISLayers returns empty.", () => {
    panel.currentTramitId = "test_id";
    app.default_properties.getGISLayers.mockReturnValue({ layers: [] });

    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    panel.update();

    expect(app.default_properties.getGISLayers).toHaveBeenCalledWith("test_id");
    expect(warnSpy).toHaveBeenCalledWith(
      "No hi ha capes definides per al tràmit:", "test_id"
    );

    warnSpy.mockRestore();
  });

  // --- hasIfcValidation() ---
  test("hasIfcValidation(): Returns true if a GlobalId is found in the first child", () => {
    app.baseObject.children = [{ userData: { IFC: { GlobalId: "12345" } } }];

    const result = panel.hasIfcValidation();

    expect(result).toBe(true);
    expect(panel.modelObject).toBe(app.baseObject.children[0]);
    expect(MessageDialog.create).not.toHaveBeenCalled();
  });

  test("hasIfcValidation(): Returns false and shows an error if GlobalId is not found.", () => {
    app.baseObject.children = [{ userData: { IFC: {} } }];

    const result = panel.hasIfcValidation();

    expect(result).toBe(false);
    expect(MessageDialog.create).toHaveBeenCalledWith(
      "ERROR",
      "i2cat|tool.gis.validation_model_error",
      "error"
    );
  });

  test("hasIfcValidation(): Returns false and shows an error if there are no children.", () => {
    app.baseObject.children = [];

    const result = panel.hasIfcValidation();

    expect(result).toBe(false);
    expect(MessageDialog.create).toHaveBeenCalled();
  });

  // --- updateLayerVisibility() ---
  test("updateLayerVisibility(): Ignores loading if the layer is already loaded.", () => {
    const object = { typeName: "ExistingLayer" };
    panel.map.set(object, { itemElem: document.createElement("div") });
    panel.loadedLayers.set("ExistingLayer", {});
    panel.hasIfcValidation = jest.fn(() => true);

    panel.updateLayerVisibility(object, true);

    expect(panel.hasIfcValidation).not.toHaveBeenCalled();
    expect(GISUtils.addWfsLayer).not.toHaveBeenCalled();
  });

  test("updateLayerVisibility(): Does not load if IFC validation fails.", () => {
    const object = { typeName: "LayerToValidate" };
    const div = document.createElement("div");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    div.appendChild(checkbox);

    panel.map.set(object, { itemElem: div });
    panel.hasIfcValidation = jest.fn(() => false);

    panel.updateLayerVisibility(object, true);

    expect(panel.hasIfcValidation).toHaveBeenCalled();
    expect(checkbox.checked).toBe(false);
    expect(GISUtils.addWfsLayer).not.toHaveBeenCalled();
    expect(panel.loadedLayers.has("LayerToValidate")).toBe(false);
  });
  
  
  // --- updateSelection() ---
  test("updateSelection(): Applies the 'selected' style and expands ancestors.", () => {
    const selectedObject = { id: 1 };
    app.selection.objects = [selectedObject];
    panel.clearNodeStyle = jest.fn();
    
    const mockTreeNode = {
      addClass: jest.fn(),
      expandAncestors: jest.fn(),
      itemElem: document.createElement('li'),
      isExpanded: jest.fn(() => false),
      expand: jest.fn(),
      collapse: jest.fn(),
      value: selectedObject
    };
    panel.map.set(selectedObject, mockTreeNode);
    panel.bodyElem = { scrollLeft: 100 };

    panel.updateSelection();

    expect(panel.clearNodeStyle).toHaveBeenCalledWith("selected");
    expect(mockTreeNode.addClass).toHaveBeenCalledWith("selected");
    expect(mockTreeNode.expandAncestors).toHaveBeenCalledWith(true); 
    expect(panel.bodyElem.scrollLeft).toBe(0);
    expect(panel.autoScroll).toBe(true);
  });

  test("updateSelection(): Does not scroll if autoScroll is false.", () => {
    const selectedObject = { id: 1 };
    app.selection.objects = [selectedObject];
    panel.autoScroll = false;
    
    const mockTreeNode = {
      addClass: jest.fn(),
      expandAncestors: jest.fn(),
      itemElem: document.createElement('li'),
      isExpanded: jest.fn(() => false),
      expand: jest.fn(),
      collapse: jest.fn(),
      value: selectedObject
    };
    panel.map.set(selectedObject, mockTreeNode);
    panel.bodyElem = { scrollLeft: 100 };

    panel.updateSelection();

    expect(mockTreeNode.expandAncestors).toHaveBeenCalledWith(false); 
  });

  test("populateObject: Creates color controls using Object.entries if the color is an object.", () => {
      const complexObject = { 
          name: "Complex Layer", 
          color: { TypeA: "#f00", TypeB: "#00f" },
          children: []
      };
      
      const treeNode = panel.populateObject(complexObject, null);
      const controlContainer = treeNode.nodeElem.querySelector('span:first-child');
      
      expect(controlContainer.children.length).toBe(3); 
      expect(controlContainer.children[1].style.background).toBe("rgb(255, 0, 0)"); // #f00
      expect(controlContainer.children[1].title).toBe("TypeA");
      expect(controlContainer.children[2].style.background).toBe("rgb(0, 0, 255)"); // #00f
      expect(controlContainer.children[2].title).toBe("TypeB");
  });

  test("populateObject: Creates a single color control if the color is a string.", () => {
    const simpleObject = { 
        name: "Simple Layer", 
        color: "red",
        children: []
    };
    
    const treeNode = panel.populateObject(simpleObject, null);
    const controlContainer = treeNode.nodeElem.querySelector('span:first-child');
    
    expect(controlContainer.children.length).toBe(2); 
    expect(controlContainer.children[1].style.background).toBe("red");
    expect(controlContainer.children[1].title).toBe("Simple Layer");
  });
  
  // --- destroyMap ---
  test("destroyMap: Deletes the object from the map recursively.", () => {
    const objA = { name: "A", children: [{ name: "B", children: [] }] };
    const nodeA = panel.tree.addNode(objA);
    const nodeB = panel.tree.addNode(objA.children[0]);
    nodeA.children = [nodeB];
    
    panel.map.set(objA, nodeA);
    panel.map.set(objA.children[0], nodeB);

    expect(panel.map.has(objA)).toBe(true);
    expect(panel.map.has(objA.children[0])).toBe(true);

    panel.destroyMap(nodeA);

    expect(panel.map.has(objA)).toBe(false);
    expect(panel.map.has(objA.children[0])).toBe(false);
  });

});