import { SitsSheet } from "./sits-sheet.js";
import { SitsActiveEffect } from "./sits-active-effect.js";
import { SitsHelpers } from "./sits-helpers.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {SitsSheet}
 */
export class SitsAgentSheet extends SitsSheet {

  /** @override */
	static get defaultOptions() {
	  return foundry.utils.mergeObject(super.defaultOptions, {
  	  classes: ["synths-in-the-shadow", "sheet", "actor", "agent"],
  	  template: "systems/synths-in-the-shadow/templates/actors/agent-sheet.html",
      width: 832,
      height: 890,
      tabs: [{navSelector: ".tabs", contentSelector: ".tab-content", initial: "abilities"}]
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

    // Prepare active effects
    sheetData.effects = SitsActiveEffect.prepareActiveEffectCategories(this.actor.effects);

    // Calculate Load
    let loadout = 0;
    sheetData.items.forEach(i => {loadout += (i.type === "item") ? parseInt(i.system.load) : 0});

    //Sanity Check
    if (loadout < 0) {
      loadout = 0;
    }
    if (loadout > 11) {
      loadout = 11;
    }

    sheetData.system.capacity.current = loadout;

    // Encumbrance Levels
    let load_level;
    let mule_level;
    load_level=["BITD.Light","BITD.Light","BITD.Light","BITD.Light","BITD.Normal","BITD.Normal","BITD.Heavy","BITD.Encumbered",
        "BITD.Encumbered","BITD.Encumbered","BITD.OverMax","BITD.OverMax"];
    mule_level=["BITD.Light","BITD.Light","BITD.Light","BITD.Light","BITD.Light","BITD.Light","BITD.Normal","BITD.Normal",
        "BITD.Heavy","BITD.Encumbered","BITD.OverMax","BITD.OverMax"];
	
    let mule_present=0;


    //look for Mule ability
    // @todo - fix translation.
    sheetData.items.forEach(i => {
      if (i.type === "ability" && i.name === "(C) Mule") {
        mule_present = 1;
      }
    });

    //set encumbrance level
    if (mule_present) {
      sheetData.system.capacity.current=mule_level[loadout];
    } else {
      sheetData.system.capacity.current=load_level[loadout];
    }

		sheetData.system.load_levels = {"BITD.Light":"BITD.Light", "BITD.Normal":"BITD.Normal", "BITD.Heavy":"BITD.Heavy"};
	

    sheetData.system.description = await TextEditor.enrichHTML(sheetData.system.description, {secrets: sheetData.owner, async: true});

    // catch unmigrated actor data and apply the Mastery unit ability to attribute maxes
    sheetData.system.attributes = this.actor.getComputedAttributes();
	
    //check for additional overload and malfunction from unit sources
    sheetData.system.overload.max = this.actor.getMaxOverload();
    sheetData.system.malfunction.max = this.actor.getMaxMalfunction();

    //check for healing minimums
    sheetData.system.repair_clock.value = this.actor.getRepairMin();

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
    let droppedEntityFull = await fromUuid(droppedEntity.uuid);
    switch (droppedEntityFull.type) {
      case "npc":
        await SitsHelpers.addAcquaintance(this.actor, droppedEntityFull);
        break;
      case "unit":
        await SitsHelpers.addUnit(this.actor, droppedEntityFull);
        break;
      case "item":
        break;
      case "ability":
        break;
      case "playbook":
        break ;
      default:
        break;
    }
  }
  /* -------------------------------------------- */

  /** @override */
	activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

		// Remove Unit from agent sheet
    html.find('.unit-delete').click(ev => {
	  const element = $(ev.currentTarget).parents(".item");
	  let unitId = element.data("itemId");
	  SitsHelpers.removeUnit(this.actor, unitId);
    });
  }

}
