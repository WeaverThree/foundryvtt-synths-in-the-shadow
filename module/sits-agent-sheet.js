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
      width: 894,
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

    // Make sure derived attributes are up to date:
    this.actor.prepareDerivedData();

    // Prepare active effects
    sheetData.effects = SitsActiveEffect.prepareActiveEffectCategories(this.actor.effects);

    sheetData.system.description = await TextEditor.enrichHTML(sheetData.system.description, {secrets: sheetData.owner, async: true});

    sheetData.sortedAbilities = this.actor.items.filter(i => { return i.type === 'ability';})
        .sort((a,b) => {return a.name.localeCompare(b.name);})
        .sort((a,b) => {
          if (a.system.purchased.value > 0 && !(b.system.purchased.value > 0)) {
            return -1;
          } else if (!(a.system.purchased.value > 0) && b.system.purchased.value > 0) {
            return 1;
          } else {
            return 0;
          }
        });

    sheetData.sortedPlaybookItems = this.actor.items
      .filter(i => {return (i.type === 'item') && (i.system.playbook.split(",").includes(this.actor.system.playbookName));})
      .sort((a,b) => {return a.name.localeCompare(b.name);});
    sheetData.sortedOtherPlaybookItems = this.actor.items
      .filter(i => {return (i.type === 'item') && !(i.system.playbook.split(",").includes(this.actor.system.playbookName)) && (i.system.playbook !== 'general');})
      .sort((a,b) => {return a.name.localeCompare(b.name);});
    sheetData.sortedGenericItems = this.actor.items
      .filter(i => {return (i.type === 'item') && (i.system.playbook === 'general');})
      .sort((a,b) => {return a.name.localeCompare(b.name);});


    return sheetData;
  }

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

		html.find("input.radio-ability, label.radio-ability").click((e) => {this._onAbilityRadio(e);});
		html.find("input.radio-ability, label.radio-ability").contextmenu((e) => {this._onAbilityRadio(e);});
    html.find("input.input-to-item").change((e) => {this._onInputToItem(e);});
    html.find("input.check-item, label.check-item").click((e) => {this._onItemCheck(e);});

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

  async _onAbilityRadio(event) {
    let type = event.target.tagName.toLowerCase();
    let radio = event.target;
    if (type == "label") {
      let labelID = $(radio).attr("for");
      radio = $(`#${labelID}`).get(0);
    }
    let value;

    let name = radio.name;
    let [targetId, targetDataPath] = name.split("-");

    if (radio.checked || (event.type == "contextmenu")) {
      //find the next lowest-value input with the same name and click that one instead
      value = parseInt(radio.value) - 1;
      this.element
        .find(`input[name="${name}"][target="${targetId}"][value="${value}"]`)
        .trigger("click");
    } else {
      value = parseInt(radio.value);
      //trigger the click on this one
      $(radio).trigger("click");
    }

    let targetItem = this.actor.items.get(targetId);
  
    await targetItem.update(this.convertDotPathToNestedObject(targetDataPath, value));
  }

  convertDotPathToNestedObject(path, value) {
    const [last, ...paths] = path.split('.').reverse();
    return paths.reduce((acc, el) => ({ [el]: acc }), { [last]: value });
  }

  async _onInputToItem(e) {
    e.preventDefault();
    let [targetId, targetDataPath] = e.target.name.split("-");
    let targetItem = this.actor.items.get(targetId);
    await targetItem.update(this.convertDotPathToNestedObject(targetDataPath, e.target.value))        
  }

  async _onItemCheck(event) {
    let type = event.target.tagName.toLowerCase();
    let radio = event.target;
    if (type == "label") {
      let labelID = $(radio).attr("for");
      radio = $(`#${labelID}`).get(0);
    }
    let value = radio.checked;
    let name = radio.name;

    this.element.find("input[name='" + name + "']").each((i,el)=>{el.value = value;});
    
    let [targetId, targetDataPath] = name.split("-");
    let targetItem = this.actor.items.get(targetId); 
    await targetItem.update(this.convertDotPathToNestedObject(targetDataPath, value));
  }
}
