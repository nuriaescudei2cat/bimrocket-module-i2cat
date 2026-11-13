/*
 * Dialog.test.js
 *
 * Unit tests for Dialog.js
 *
 */

/**
 * @jest-environment jsdom
 */

import { Dialog } from "../../../../platform/ui/dialog/Dialog.js";
import { Controls } from "../../../../platform/ui/Controls.js";
import { I18N } from "../../../../platform/i18n/I18N.js";

jest.mock("../../../../platform/ui/Controls.js", () => ({
  Controls: {
    addIcon: jest.fn(),
    addText: jest.fn(),
    addTextWithArgs: jest.fn(),
    addCode: jest.fn(),
    addTextField: jest.fn(),
    addNumberField: jest.fn(),
    addTextAreaField: jest.fn(),
    addPasswordField: jest.fn(),
    addSelectField: jest.fn(),
    addCheckBoxField: jest.fn(),
    addRadioButtons: jest.fn(),
    addButton: jest.fn(),
    addCodeEditor: jest.fn(),
  }
}));

jest.mock("../../../../platform/i18n/I18N.js", () => ({
  
  I18N: {
    set: jest.fn()
  }
}));

describe("Dialog", () => {

  let dialog;

  beforeEach(() => {
    dialog = new Dialog("Test Title");
  });

  test("should initialize with correct elements and title", () => {
    expect(dialog.title).toBe("Test Title");
    expect(dialog.dialogElem).toBeInstanceOf(HTMLElement);
    expect(dialog.headerElem).toBeInstanceOf(HTMLElement);
    expect(dialog.bodyElem).toBeInstanceOf(HTMLElement);
    expect(dialog.footerElem).toBeInstanceOf(HTMLElement);
    expect(I18N.set).toHaveBeenCalled();
  });

  test("should show and hide dialog", () => {
    document.body.innerHTML = "";
    dialog.show();

    expect(document.body.contains(dialog.dialogElem)).toBe(true);
    expect(document.body.contains(dialog.curtainElem)).toBe(true);

    dialog.hide();

    expect(document.body.contains(dialog.dialogElem)).toBe(false);
    expect(document.body.contains(dialog.curtainElem)).toBe(false);
  });

  test("should maximize and minimize dialog", () => {
    dialog.maximized = true;
    expect(dialog.dialogElem.classList.contains("maximized")).toBe(true);

    dialog.maximized = false;
    expect(dialog.dialogElem.classList.contains("maximized")).toBe(false);
  });

  test("should set size correctly", () => {
    dialog.setSize(500, 400);
    expect(dialog._width).toBe(500);
    expect(dialog._height).toBe(400);
    expect(dialog.dialogElem.style.width).toBe("500px");
    expect(dialog.dialogElem.style.height).toBe("400px");
  });

  test("should add text using Controls", () => {
    dialog.addText("Hello", "my-class");
    expect(Controls.addText).toHaveBeenCalledWith(dialog.bodyElem, "Hello", "my-class");
  });

  test("should call onShow and onHide callbacks", () => {
    const onShow = jest.fn();
    const onHide = jest.fn();
    dialog.onShow = onShow;
    dialog.onHide = onHide;

    dialog.show();
    expect(onShow).toHaveBeenCalled();

    dialog.hide();
    expect(onHide).toHaveBeenCalled();
  });

});