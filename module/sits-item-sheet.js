/**
 * Extend the basic ItemSheet
 * @extends {ItemSheet}
 */
import {onManageActiveEffect, prepareActiveEffectCategories} from "./effects.js";
import { SitsActiveEffect } from "./sits-active-effect.js";

export class SitsItemSheet extends ItemSheet {

  /** @override */
	static get defaultOptions() {

	  return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["synths-in-the-shadow", "sheet", "item"],
			width: 560,
			height: 'auto',
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}]
		});
  }

  /* -------------------------------------------- */

  /** @override */
  get template() {
    const path = "systems/synths-in-the-shadow/templates/items";
    let simple_item_types = ["maker", "build", "deviance", "malfunction",  "unit_reputation"];
    let template_name = `${this.item.type}`;

    if (simple_item_types.indexOf(this.item.type) >= 0) {
      template_name = "simple";
    }

    return `${path}/${template_name}.html`;
  }

  /* -------------------------------------------- */

  /** @override */
	activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    html.find(".effect-control").click(ev => {
      if ( this.item.isOwned ) return ui.notifications.warn(game.i18n.localize("BITD.EffectWarning"))
      SitsActiveEffect.onManageActiveEffect(ev, this.item)
    });
  }

  /* -------------------------------------------- */

  /** @override */
  async getData(options) {
    const superData = super.getData( options );
    const sheetData = superData.data;

    sheetData.isGM = game.user.isGM;
    sheetData.owner = superData.owner;
    sheetData.editable = superData.editable;

    // Prepare Active Effects
    sheetData.effects = prepareActiveEffectCategories(this.document.effects);

    sheetData.system.description = await TextEditor.enrichHTML(sheetData.system.description, {secrets: sheetData.owner, async: true});
    
    if (this.item.type == 'playbook') {
      // World (eventually compendium) abilities for playbook sorted alphabetically
      sheetData.sortedAbilities = game.items
      .filter(i => {return (i.type === 'ability') && (i.system.playbook.toLowerCase() === this.item.name.toLowerCase());})
      .sort((a,b) => {return a.name.localeCompare(b.name);});

      // World (eventually compendium) items for playbook sorted alphabetically
      sheetData.sortedPlaybookItems = game.items
        .filter(i => {return (i.type === 'item') && (i.system.playbook.toLowerCase().split(",").includes(this.item.name.toLowerCase()));})
        .sort((a,b) => {return a.name.localeCompare(b.name);});
    }

    return sheetData;
  }
}
