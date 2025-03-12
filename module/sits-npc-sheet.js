
import { SitsSheet } from "./sits-sheet.js";

/**
 * @extends {SitsSheet}
 */
export class SitsNPCSheet extends SitsSheet {

  static DEFAULT_OPTIONS = {
    id: "sits-npc-sheet",
    classes: ["synths-in-the-shadow"],
    position: {
      width: 800,
      height: 'auto'
    },
    actions: {
    }
  }
  
  static PARTS = {
    npcsheet: {
      id: "npc-sheet",
      template: "systems/synths-in-the-shadow/templates/actors/npc-sheet.hbs",
      scrollable: ["window-content"],
    }
  }

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext( options );

    context.system.description = await TextEditor.enrichHTML(context.system.description, {secrets: context.owner, async: true});

    return context;
  }

  /* -------------------------------------------- */

    /** @override */

}