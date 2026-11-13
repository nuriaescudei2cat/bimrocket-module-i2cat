/*
 * UploadModelTool.test.js
 *
 * Unit tests for UploadModelTool.js
 *
 */


import { UploadModelTool } from '../../js/tools/UploadModelTool.js';


jest.mock('../../js/ui/UploadModelPanel.js', () => {
  return {
    UploadModelPanel: jest.fn().mockImplementation(() => ({
      visible: false
    }))
  };
});

describe("Given the UploadModelTool", () => {
  let mockApplication;
  let tool;

  beforeEach(() => {
    mockApplication = {
      addTool: jest.fn(),
      panelManager: {
        addPanel: jest.fn()
      }
    };

    tool = new UploadModelTool(mockApplication, { someOption: true });
  });

  describe("When it initiates", () => {
    test("Then the name and className properties should be 'upload_model'", () => {
      const expectedName = 'upload_model';
      const expectedClassName = 'upload_model'

      expect(tool.name).toBe(expectedName);
      expect(tool.className).toBe(expectedClassName);
    })

    test("Then it should call the method 'addPanel' one time", () => {
      const expectedInvocationTimes = 1;

      expect(mockApplication.panelManager.addPanel).toHaveBeenCalledTimes(expectedInvocationTimes);
    })
  })

  describe("When the method 'activate' is called", () => {
    test('Then the panel must be visible', () => {
      const expectedResult = true;

      tool.activate();

      expect(tool.uploadModelPanel.visible).toBe(expectedResult);
    });
  })

  describe("When the method 'deactivate' is called", () => {
    test('Then the panel must not be visible', () => {
      const expectedResult = false;
      tool.uploadModelPanel.visible = true;

      tool.deactivate();

      expect(tool.uploadModelPanel.visible).toBe(expectedResult);
    });
  })
})