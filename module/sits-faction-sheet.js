import { SitsSheet } from "./sits-sheet.js";
import { SitsActiveEffect } from "./sits-active-effect.js";
import { SitsHelpers } from "./sits-helpers.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {SitsSheet}
 */
export class SitsFactionSheet extends SitsSheet {

  /** @override */
	static get defaultOptions() {
	  return foundry.utils.mergeObject(super.defaultOptions, {
  	  classes: ["synths-in-the-shadow", "sheet", "actor", "faction"],
  	  template: "systems/synths-in-the-shadow/templates/actors/faction-sheet.html",
      //width: 888,
      //height: 890,
      //tabs: [{navSelector: ".tabs", contentSelector: ".tab-content", initial: "abilities"}]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  async getData(options) {
    const superData = super.getData( options );
    const sheetData = superData.data;
    sheetData.owner = superData.owner;
    sheetData.editable = superData.editable;
    sheetData.isGM = game.user.isGM;

    // Make sure derived attributes are up to date:
    this.actor.prepareDerivedData();

    // Prepare active effects
    sheetData.effects = SitsActiveEffect.prepareActiveEffectCategories(this.actor.effects);

    return sheetData;
  }

  /** @override **/
  async _onDropItem(event, droppedItem) {
    await super._onDropItem(event, droppedItem);
    if (!this.actor.isOwner) {
      ui.notifications.error(`You do not have sufficient permissions to edit this agent. Please speak to your GM if you feel you have reached this message in error.`, {permanent: true});
      return false;
    }
	  await this.handleDrop(event, droppedItem);
  }

  /** @override **/
  async _onDropActor(event, droppedActor){
    await super._onDropActor(event, droppedActor);
    if (!this.actor.isOwner) {
      ui.notifications.error(`You do not have sufficient permissions to edit this agent. Please speak to your GM if you feel you have reached this message in error.`, {permanent: true});
      return false;
    }
    await this.handleDrop(event, droppedActor);
  }

  /** @override **/
  async handleDrop(event, droppedEntity){
    // let droppedEntityFull = await fromUuid(droppedEntity.uuid);
    // switch (droppedEntityFull.type) {
    //   case "npc":
    //     await SitsHelpers.addAcquaintance(this.actor, droppedEntityFull);
    //     break;
    //   case "unit":
    //     await SitsHelpers.addUnit(this.actor, droppedEntityFull);
    //     break;
    //   case "item":
    //     break;
    //   case "ability":
    //     break;
    //   case "playbook":
    //     break ;
    //   default:
    //     break;
    // }
  }
  /* -------------------------------------------- */

  /** @override */
	activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

		// Remove Unit from agent sheet
    // html.find('.unit-delete').click(ev => {
	  // const element = $(ev.currentTarget).parents(".item");
	  // let unitId = element.data("itemId");
	  // SitsHelpers.removeUnit(this.actor, unitId);
    // });
  }

}
