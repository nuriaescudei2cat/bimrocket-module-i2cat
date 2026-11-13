/**
 * ToolManager.js
 *
 * @author alexis-i2cat
 */

export const ToolManager = {

  // ==========================================
  // Private Methods
  // ==========================================

  /**
   * Gets the index (position) of a tool button within the toolbar.
   *
   * @param {Object} toolBar - Toolbar instance.
   * @param {Object} tool - Tool instance.
   * @returns {Number|undefined} The index of the button, or undefined if not found.
   * @private
   */
  _getToolbarIndex(toolBar, tool)
  {
    if (!toolBar || typeof toolBar.getToolButton !== "function") return undefined;

    const button = toolBar.getToolButton(tool);

    if (button && button.buttonElem && button.buttonElem.parentElement)
    {
      const children = Array.from(button.buttonElem.parentElement.children);
      const index = children.indexOf(button.buttonElem);
      return index !== -1 ? index : undefined;
    }

    return undefined;
  },

  /**
   * Removes the panel associated with a tool from the application interface.
   *
   * @param {Object} application - Main application instance.
   * @param {Object} tool - Instance of the tool whose panel is to be removed.
   * @private
   */
  _removePanel(application, tool)
  {
    if (!tool || !tool.panel) return;

    if (application.panelManager && application.panelManager.removePanel)
    {
      application.panelManager.removePanel(tool.panel);
    }
    else if (tool.panel.element)
    {
      tool.panel.element.remove();
    }
  },

  // ==========================================
  // Public API
  // ==========================================

  /**
   * Completely removes a tool from the application and the interface (menu, toolbar, panels).
   *
   * @param {Object} application - Main application instance.
   * @param {String} toolName - Name/ID of the tool to remove.
   */
  removeTool(application, toolName)
  {
    const tool = application.tools[toolName];
    if (!tool) return;

    if (application.tool === tool) application.useTool(null);

    this._removePanel(application, tool);

    application.toolBar?.removeToolButton(tool);

    const menuItem = application.menuBar?.getActionMenuItem(tool);
    if (menuItem) menuItem.remove();

    application.removeTool(tool);
  },

  /**
   * Adds a tool to the application, optionally including it in menus and toolbars.
   *
   * @param {Object} application - Main application instance.
   * @param {Object} tool - Instance of the new tool to add.
   * @param {Object} [options={}] - Location configuration options.
   * @param {Object} [options.targetMenu] - Target menu where the tool will be added.
   * @param {Object} [options.targetToolbar] - Target toolbar.
   * @param {Number} [options.toolbarIndex] - Position index in the toolbar.
   * @param {Number} [options.menuIndex] - Position index in the menu.
   * @param {Number} [options.index] - General index (fallback if the above are not specified).
   */
  addTool(application, tool, options = {})
  {
    const { targetMenu, targetToolbar } = options;
    const toolbarIndex = options.toolbarIndex ?? options.index;
    const menuIndex = options.menuIndex ?? options.index;

    application.addTool(tool);

    if (targetToolbar) targetToolbar.addToolButton(tool, toolbarIndex);
    if (targetMenu) targetMenu.addMenuItem(tool, menuIndex);
  },

  /**
   * Replaces an existing tool with a new one, keeping its position in the UI as much as possible.
   *
   * @param {Object} application - Main application instance.
   * @param {String} oldToolName - Name/ID of the tool to replace.
   * @param {Object} newTool - Instance of the new tool.
   * @param {Object} [options={}] - Options to override the target location.
   */
  replaceTool(application, oldToolName, newTool, options = {})
  {
    let { targetMenu, targetToolbar = application.toolBar } = options;
    let toolbarIndex = options.toolbarIndex ?? options.index;
    let menuIndex = options.menuIndex ?? options.index;

    const oldTool = application.tools[oldToolName];

    if (oldTool)
    {
      if (targetToolbar && toolbarIndex === undefined)
      {
        toolbarIndex = this._getToolbarIndex(targetToolbar, oldTool);
      }

      const menuItem = application.menuBar?.getActionMenuItem(oldTool);
      if (menuItem)
      {
        if (!targetMenu) targetMenu = menuItem.parentMenu || menuItem.container;
        if (menuIndex === undefined)
        {
          const i = menuItem.getIndex();
          menuIndex = i >= 0 ? i : undefined;
        }
      }

      this.removeTool(application, oldToolName);
    }

    this.addTool(application, newTool, {
      targetMenu, targetToolbar, toolbarIndex, menuIndex,
    });
  },

  /**
   * Hides a tool from the interface (toolbar and menus) without destroying it or removing it from the application.
   *
   * @param {Object} application - Main application instance.
   * @param {String} toolName - Name/ID of the tool to hide.
   */
  hideTool(application, toolName)
  {
    const tool = application.tools[toolName];
    if (!tool) return;

    application.toolBar?.removeToolButton(tool);
    const menuItem = application.menuBar?.getActionMenuItem(tool);

    if (menuItem) menuItem.remove();
  },

  /**
   * Removes a list of items from a menu or context menu.
   *
   * @param {Object} menu - The menu instance (e.g., fileExplorer.contextMenu).
   * @param {Array<String>} itemsToRemove - Array containing the names/IDs of the items to remove.
   */
  removeFileExplorerItems(menu, itemsToRemove = [])
  {
    if (!menu || typeof menu.getMenuItem !== "function") return;

    for (const itemName of itemsToRemove)
    {
      const item = menu.getMenuItem(itemName);
      if (item) item.remove();
    }
  },
};
