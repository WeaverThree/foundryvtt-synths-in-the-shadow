import { SitsSheet } from "./sits-sheet.js";
import { SitsActiveEffect } from "./sits-active-effect.js";
import { SitsHelpers } from "./sits-helpers.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {SitsSheet}
 */
export class SitsFactionSheet extends SitsSheet {

  static DEFAULT_OPTIONS = {
    classes: ["synths-in-the-shadow"],
    position: {
      width: 800,
      height: 'auto'
    },
    actions: {
    }
  }
  
  static PARTS = {
    agentsheet: {
      template: "systems/synths-in-the-shadow/templates/actors/faction-sheet.hbs",
      scrollable: ["window-content"],
    }
  }

  /* -------------------------------------------- */

 /** @override */
 async _prepareContext(options) {
    const context = await super._prepareContext( options );

    // Prepare active effects??
    context.effects = SitsActiveEffect.prepareActiveEffectCategories(this.actor.effects);

    context.ranks = []
    context.subranks = [];
    
    let i = 0;
    let v = this.actor.system.rank.value;
    this.actor.system.rank.ranks.forEach((rank) => {
      context.ranks.push({rank:game.i18n.localize(rank), active:v == i+1 || v == i+2});
      context.subranks.push({subrank:"-", active:v==i+1});
      context.subranks.push({subrank:"+", active:v==i+2});
      i += 2;
    })
    context.maxrank = i;

    context.sortedContacts = Object.entries(this.actor.system.contacts).map(([x,y]) => y).sort((a,b) => {return a.name.localeCompare(b.name)})

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

    return context;
  }

  async _onDropActor(event, actor) {
    switch (actor.type) {
      case "npc":
        await SitsHelpers.addContact(this.actor, actor);
        this.render(true); // not sure why needed but...
        break;
    }
  }

}