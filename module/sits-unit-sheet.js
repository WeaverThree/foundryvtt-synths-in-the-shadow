import { SitsSheet } from "./sits-sheet.js";
import { SitsActiveEffect } from "./sits-active-effect.js";
import { SitsHelpers } from "./sits-helpers.js";

/**
 * @extends {SitsSheet}
 */
export class SitsUnitSheet extends SitsSheet {

  /** @override */
	static get defaultOptions() {
	  return foundry.utils.mergeObject(super.defaultOptions, {
  	  classes: ["synths-in-the-shadow", "sheet", "actor", "unit"],
  	  template: "systems/synths-in-the-shadow/templates/actors/unit-sheet.html",
      width: 940,
      height: 940,
      tabs: [{navSelector: ".tabs", contentSelector: ".tab-content", initial: "turfs"}]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData(options) {
    const superData = super.getData( options );
    const sheetData = superData.data;
    sheetData.owner = superData.owner;
    sheetData.editable = superData.editable;
    sheetData.isGM = game.user.isGM;
	
    // Prepare active effects
    sheetData.effects = SitsActiveEffect.prepareActiveEffectCategories(this.actor.effects);

    // Calculate Turfs amount.
    let turfs_amount = 0;
	let turfs_max = sheetData.system.turf.max;

    sheetData.items.forEach(item => {

      if (item.type === "unit_playbook") {
        Object.entries(item.system.turfs).forEach(([key, turf]) => {
          if (turf.name === 'BITD.Turf') {
            turfs_amount += (turf.value === true) ? 1 : 0;
          }
        });
      }

    });
	
	turfs_amount = turfs_amount + sheetData.system.turf.bonus;
	if (turfs_amount > turfs_max) {turfs_amount = turfs_max;};
    sheetData.system.turfs_amount = turfs_amount;
	
	//return data
    return sheetData;
	
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
      case "item":
        break;
      case "unit_playbook":
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

    // Add Unit Type
    html.find(".unit-playbook").click(this._onItemAddClick.bind(this));

    // Toggle Turf
    html.find('.turf-select').click( async ev => {
      const element = $(ev.currentTarget).parents(".item");

      let item_id = element.data("itemId")
      let turf_id = $(ev.currentTarget).data("turfId");
      let turf_current_status = $(ev.currentTarget).data("turfStatus");
      let turf_checkbox_name = 'system.turfs.' + turf_id + '.value';

      await this.actor.updateEmbeddedDocuments('Item', [{
        _id: item_id,
        [turf_checkbox_name]: !turf_current_status}]);
      this.render(false);
    });

  }


  /* -------------------------------------------- */
  /*  Form Submission                             */
	/* -------------------------------------------- */

  /** @override */
  async _updateObject(event, formData) {

    // Update the Item
    await super._updateObject(event, formData);

    if (event.target && event.target.name === "system.tier") {
      this.render(true);
    }
  }
  /* -------------------------------------------- */

}
