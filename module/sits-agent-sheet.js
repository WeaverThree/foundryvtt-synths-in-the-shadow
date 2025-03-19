import { SitsSheet } from "./sits-sheet.js";
import { SitsActiveEffect } from "./sits-active-effect.js";
import { SitsHelpers } from "./sits-helpers.js";
import { SitsActor } from "./sits-actor.js"

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {SitsSheet}
 */
export class SitsAgentSheet extends SitsSheet {

  static DEFAULT_OPTIONS = {
    classes: ["synths-in-the-shadow"],
    position: {
      width: 873,
      height: 'auto'
    },
    actions: {
      radioAbility: SitsAgentSheet.onRadioAbility,
      checkItem: SitsAgentSheet.onCheckItem,
      deleteUnit: SitsAgentSheet.onDeleteUnit,

    }
  }
  
  static PARTS = {
    agentsheet: {
      template: "systems/synths-in-the-shadow/templates/actors/agent-sheet.hbs",
      scrollable: ["window-content"],
    }
  }

  tabGroups = {
    main: "mainpage"
  }

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext( options );

    context.tabs = this.#getTabs();

    // Prepare active effects
    context.effects = SitsActiveEffect.prepareActiveEffectCategories(this.actor.effects);

    // IDK what this is
    context.system.description = await TextEditor.enrichHTML(context.system.description, {secrets: context.owner, async: true});

    // Abilities sorted alphabetically and then any we have invested in moved to the top
    context.sortedAbilities = this.actor.items.filter(i => { return i.type === 'ability';})
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
  
    context.anyAbilities = context.sortedAbilities.length !== 0;

    let sortorder = ['weapons', 'armor', 'tools', 'mobility', 'documents', 'programs', 'misc'];
    
    // All of this playbook's items
    context.sortedPlaybookItems = this.actor.items
      .filter(i => {return (i.type === 'item') && (i.system.playbook.toLowerCase().split(",").includes(this.actor.system.playbookName.toLowerCase()));})
      .sort((a,b) => {return a.name.localeCompare(b.name);})
      .sort((a,b) => {return sortorder.indexOf(a.system.category.toLowerCase()) - sortorder.indexOf(b.system.category.toLowerCase())});

    // All other non-general items
    context.sortedOtherPlaybookItems = this.actor.items
      .filter(i => {return (i.type === 'item') && !(i.system.playbook.toLowerCase().split(",").includes(this.actor.system.playbookName.toLowerCase())) && (i.system.playbook !== 'general');})
      .sort((a,b) => {return a.name.localeCompare(b.name);})
      .sort((a,b) => {return sortorder.indexOf(a.system.category.toLowerCase()) - sortorder.indexOf(b.system.category.toLowerCase())});
  
    // General items
    context.sortedGenericItems = this.actor.items
      .filter(i => {return (i.type === 'item') && (i.system.playbook === 'general');})
      .sort((a,b) => {return a.name.localeCompare(b.name);})
      .sort((a,b) => {return sortorder.indexOf(a.system.category.toLowerCase()) - sortorder.indexOf(b.system.category.toLowerCase())});

    context.anyItems = (context.sortedPlaybookItems.length !== 0) 
        || (context.sortedOtherPlaybookItems.length !== 0)
        || (context.sortedGenericItems !== 0)

    context.sortedContacts = Object.entries(this.actor.system.contacts).map(([x,y]) => y).sort((a,b) => {return a.name.localeCompare(b.name)})

    context.anyContacts = context.sortedContacts.length !== 0;

    context.capacityMaxPlusOne = this.actor.system.capacity.max + 1; // Since we can't do wthis in HBS



    return context;
  }



  #getTabs() {
    const tabs = {
      mainpage: {id: "mainpage", group: "main", gmOnly:false, gmOnly:true, label: "SITS.AbilitiesLoadoutContacts"},
      agentnotes: {id: "agentnotes", group: "main", gmOnly:false, label: "SITS.Notes"},
      effects: {id: "effects", group: "main", gmOnly:true, label: "SITS.Effects"},
      allagentitems: {id: "allagentitems", group: "main", label: "SITS.AllItems"}
    }
    for ( const v of Object.values(tabs) ) {
      v.active = this.tabGroups[v.group] === v.id;
      v.cssClass = v.active ? "active" : "";
    }
    return tabs;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const itemQuantities = this.element.querySelectorAll('.input-to-item');
    for (const input of itemQuantities) {
      input.addEventListener("change", async (e) => {
        e.preventDefault();
        let [targetId, targetDataPath] = e.target.name.split("-");
        let targetItem = this.actor.items.get(targetId);
        await targetItem.update(SitsHelpers.convertDotPathToNestedObject(targetDataPath, e.target.value))  
      });
    }
  }

  async _onDropActor(event, actor) {
    switch (actor.type) {
      case "npc":
        await SitsHelpers.addContact(this.actor, actor);
        break;
      case "unit":
        await SitsHelpers.addUnit(this.actor, actor);
        break;
    }
  }

  async _onDropItem(event, item) {
    switch (item.type) {
      case "playbook":
        await this._newPlaybook(item);
        break;
    }
    await super._onDropItem(event,item);
  }


  async _newPlaybook(playbook) {
    // Clear items and abilities
    let removeItems = this.actor.items.filter((x) => {return x.type === 'item' || x.type ==='ability'}).map((x) => {return x.id});
    await this.actor.deleteEmbeddedDocuments('Item', removeItems);

    // And contacts
    await this.actor.update({system: {contacts: ""}});
    await this.actor.update({system: {contacts: {}}});
    
    // Add all abilities for this playbook
    await this.actor.createEmbeddedDocuments('Item',
      game.items.filter((x) => {return x.type === 'ability' && x.system.playbook.toLowerCase().split(",").includes(playbook.name.toLowerCase());})
    );

    // Add all items for this playbook
    await this.actor.createEmbeddedDocuments('Item',
      game.items.filter((x) => {return x.type === 'item' && x.system.playbook.toLowerCase().split(",").includes(playbook.name.toLowerCase());})
    );

    // Add all general items (avoids degenerate case of general + playbook items)
    await this.actor.createEmbeddedDocuments('Item',
      game.items.filter((x) => {return x.type === 'item' && x.system.playbook.toLowerCase().split(",").includes("general") && !(x.system.playbook.toLowerCase().split(",").includes(playbook.name.toLowerCase()));})
    );

    // And contacts
    let contactNames = playbook.system.contacts.split('\n').map((line) => {return line.trim();}).filter((line) => {return line;});
    let usedNames = [];
    
    game.actors.filter((x) => {return x.type==='npc'}).forEach(async (npc) => {
      if (contactNames.includes(npc.name)) {
        usedNames.push(npc.name);
        await SitsHelpers.addContact(this.actor, npc);
      }
    })

    contactNames.forEach(async (name) => {
      if(!usedNames.includes(name)) {
        let newNpc = await SitsActor.create({name:name, type:"npc"});
        await SitsHelpers.addContact(this.actor, newNpc);
      }
    })

    // Actually add the playbook
    await Item.create(playbook, {parent: this.document});
  }




  static async onDeleteUnit(event, target) {
    SitsHelpers.removeUnit(this.actor);
  }


  /* -------------------------------------------- */

  static async onRadioAbility(event, target) {
    let labelID = target.getAttribute("for");
    let radio = $(`#${labelID}`).get(0);
    
    let value;
    let name = radio.name;
    let [targetId, targetDataPath] = name.split("-");

    if (radio.checked || (event.type == "contextmenu")) {
      //find the next lowest-value input with the same name and click that one instead
      value = parseInt(radio.value) - 1;
      $(`input[name="${name}"][target="${targetId}"][value="${value}"]`).click();
    } else {
      // trigger the click on this one
      value = parseInt(radio.value);
      radio.click();
    }

    let targetItem = this.actor.items.get(targetId);
  
    await targetItem.update(SitsHelpers.convertDotPathToNestedObject(targetDataPath, value));
  }

  static async onCheckItem(event, target) {
    let labelID = target.getAttribute("for");
    let radio = $(`#${labelID}`).get(0);

    let value = !radio.checked;
    let name = radio.name;

    $("input[name='" + name + "']").each((i,el)=>{el.value = value;});
    
    let [targetId, targetDataPath] = name.split("-");
    let targetItem = this.actor.items.get(targetId); 
    await targetItem.update(SitsHelpers.convertDotPathToNestedObject(targetDataPath, value));
  }
}
