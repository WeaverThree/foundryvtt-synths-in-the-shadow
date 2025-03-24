/**
 * Extend the basic ItemSheet
 * @extends {ItemSheet}
 */
import {onManageActiveEffect, prepareActiveEffectCategories} from "./effects.js";
import { SitsActiveEffect } from "./sits-active-effect.js";

const {api, sheets, ux} = foundry.applications;

export class SitsItemSheet extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ["synths-in-the-shadow", "item-sheet"],
    position: {
      width: 600,
      height: 'auto'
    },
    actions: {
      // itemAddPopup: SitsSheet.onItemAddPopup,
      radioToggle: SitsItemSheet.onRadioToggle,
      // radioToggleSingle: SitsSheet.onRadioToggleSingle,
      // rollAttribute: SitsSheet.onRollAttribute,
      // standingToggle: SitsSheet.onStandingToggle,
      // openContact: SitsSheet.onOpenContact,
      // openItem: SitsSheet.onOpenItem,
      // deleteContact: SitsSheet.onDeleteContact,
      // deleteItem: SitsSheet.onDeleteItem,
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
  }

  static PARTS = {
    header: {
      template: "systems/synths-in-the-shadow/templates/items/item-header.hbs"
    },
    description: {
      template: "systems/synths-in-the-shadow/templates/items/item-description.hbs"
    },
    core: {
      template: "systems/synths-in-the-shadow/templates/items/item-core.hbs"
    },
    effects: {
      template: "systems/synths-in-the-shadow/templates/items/item-effects.hbs"
    },
    gmnotes: {
      template: "systems/synths-in-the-shadow/templates/items/item-gmnotes.hbs"
    },
  }

    // html.find(".effect-control").click(ev => {
    //   if ( this.item.isOwned ) return ui.notifications.warn(game.i18n.localize("BITD.EffectWarning"))
    //   SitsActiveEffect.onManageActiveEffect(ev, this.item)
    // });
  
  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext( options );

    context.isGM = game.user.isGM;
    context.owner = context.owner;
    context.system = this.item.system;
    context.name = this.item.name;
    context._id = this.item._id;
    context.uuid = this.item.uuid;
    context.img = this.item.img;

    // Prepare Active Effects
    context.effects = prepareActiveEffectCategories(this.document.effects);

    let simple_item_types = ["maker", "build", "deviance", "malfunction", "chip", "unit_reputation", "city_sector"];
    let core_name = `${this.item.type}`;
    if (core_name === 'unit_construction' || core_name === 'unit_research') {
      core_name = 'construction-research';
    }
    context.hascore = true;

    if (simple_item_types.indexOf(this.item.type) >= 0) {
      context.hascore = false;
    }
    context.core_subtemplate = [`systems/synths-in-the-shadow/templates/items/core-${core_name}.hbs`]

    context.enrichedDescription = await TextEditor.enrichHTML(context.system.description, {secrets: context.owner, async: true});
    context.enrichedExpClue = await TextEditor.enrichHTML(context.system.experience_clue, {secrets: context.owner, async: true});


    if (core_name === 'construction-research') {
      context.sizeDropdown = {
        "4": "4",
        "5": "5",
        "6": "6",
        "8": "8",
        "10": "10",
        "12": "12",
        "16": "16",
      };
      context.colorDropdown = {
        "blue": "SITS.Colors.Blue",
        "green": "SITS.Colors.Green",
        "red": "SITS.Colors.Red",
        "yellow": "SITS.Colors.Yellow",
        "white": "SITS.Colors.White",
        "black": "SITS.Colors.Black",
      };
    }

    if (this.item.type == 'playbook') {

      context.skills = game.system.skills;

      // World (eventually compendium) abilities for playbook sorted alphabetically
      context.sortedAbilities = game.items
      .filter(i => {return (i.type === 'ability') && (i.system.playbook.toLowerCase() === this.item.name.toLowerCase());})
      .sort((a,b) => {return a.name.localeCompare(b.name);});

      // World (eventually compendium) items for playbook sorted alphabetically
      context.sortedPlaybookItems = game.items
        .filter(i => {return (i.type === 'item') && (i.system.playbook.toLowerCase().split(",").includes(this.item.name.toLowerCase()));})
        .sort((a,b) => {return a.name.localeCompare(b.name);});
    }

    return context;
  }

  static async onRadioToggle(event, target) {
    event.preventDefault();
    let labelID = target.getAttribute("for");
    target = document.getElementById(labelID);

    if (target.checked || (event.type == "contextmenu")) {
      //find the next lowest-value input with the same name and click that one instead
      let name = target.name;
      let value = parseInt(target.value) - 1;
      document.querySelector(`input[name="${name}"][value="${value}"]`).click();
    } else {
      //trigger the click on this one
      target.click();
    }
  }	

}
