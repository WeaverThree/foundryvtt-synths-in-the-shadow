import { SitsActiveEffect } from "./sits-active-effect.js";
import { SitsHelpers } from "./sits-helpers.js";

const {api, sheets, ux} = foundry.applications;

export class SitsSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    actions: {
      itemAddPopup: SitsSheet.onItemAddPopup,
      radioToggle: SitsSheet.onRadioToggle,
      radioToggleSingle: SitsSheet.onRadioToggleSingle,
      rollAttribute: SitsSheet.onRollAttribute,
      standingToggle: SitsSheet.onStandingToggle,
      openContact: SitsSheet.onOpenContact,
      openItem: SitsSheet.onOpenItem,
      deleteContact: SitsSheet.onDeleteContact,
      deleteItem: SitsSheet.onDeleteItem,
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
  }

  // constructor(options = {}) {
  //   super(options);
  // }

  // Setup event handlers other than clicks
  // async _onRender(context, options) {
  //   await super._onRender(context, options);
  // }

  async _prepareContext(options) {
    const context = await super._prepareContext( options );

    
    context.isGM = game.user.isGM;
    context.editable = this.isEditable;
    
    context.system = this.actor.system;
    context.items = this.actor.items;
    context.name = this.actor.name;
    context._id = this.actor._id;
    context._id2 = context._id + "-2"; // For second clocks and such
    context.img = this.actor.img;
    
    return context;
  }
  

     // manage active effects
    // html.find(".effect-control").click(ev => SitsActiveEffect.onManageActiveEffect(ev, this.actor));	


  static async onDeleteItem(event,target) {
    const targetId = target.getAttribute("data-target");
    await this.actor.deleteEmbeddedDocuments("Item", [targetId]);
  }

  static async onDeleteContact(event, target) {
    SitsHelpers.removeContact(this.actor, target.getAttribute("data-target"));
    this.render(true);
  }

  static onStandingToggle(event, target) {
    let contacts = this.actor.system.contacts;
    let contactId = target.getAttribute("data-contact");
    let targetContact = contacts[contactId];
    let oldStanding = targetContact.standing;
    let newStanding;
    switch(oldStanding){
      case "friend":
        newStanding = "rival";
        break;
      case "rival":
        newStanding = "neutral";
        break;
      case "neutral":
        newStanding = "friend";
        break;
    }
    targetContact.standing = newStanding;
    this.actor.update({system: {contacts: contacts}});
  }

  static onOpenContact(event, target) {
    game.actors.get(target.getAttribute('data-target'))?.sheet.render(true);
  }

  static onOpenItem(event, target) {
    this.actor.items.get(target.getAttribute('data-target'))?.sheet.render(true);
  }

  /* -------------------------------------------- */

  static async onItemAddPopup(event, target) {
    event.preventDefault();
    const item_type = target.getAttribute("data-item-type")
    const distinct = target.getAttribute("data-distinct")?.toLowerCase() == "true";

    let input_type = distinct ? "radio" : "checkbox";

    let items = await SitsHelpers.getAllItemsByType(item_type, game);

    let html = `<div class="items-to-add">`;
    
    if (item_type !== 'playbook' && items.length !== 0 && items[0]?.system?.playbook !== undefined) {

      // Display items sorted in groups by playbook

      let itemgroups = {};
      items.forEach((item) => {
        const playbook = item.system.playbook.toLowerCase();
        if (!(playbook in itemgroups)) {
          itemgroups[playbook] = [];
        }
        itemgroups[playbook].push(item);
      })

      Object.entries(itemgroups).map(([k,v]) => {return k;}).sort((a,b) => {return a.localeCompare(b)}).forEach((sortedkey) => {

        html += `<h2>${sortedkey.toUpperCase()}</h2>`

        itemgroups[sortedkey].sort((a,b) => {return a.name.localeCompare(b.name);}).forEach(item => {
          html += `<div class="item"><input id="select-item-${item._id}" type="${input_type}" name="select_items" value="${item._id}">`;
          html += `<label class="flex-horizontal" for="select-item-${item._id}">`;
          html += `${game.i18n.localize(item.name)}`;
          html += `</label>`
          html += `${item.system.description}</div>`;
        });
      });

    } else { // Just display a list of items

      items.sort((a,b) => {return a.name.localeCompare(b.name);}).forEach(item => {
        html += `<div class="item"><input id="select-item-${item._id}" type="${input_type}" name="select_items" value="${item._id}">`;
        html += `<label class="flex-horizontal" for="select-item-${item._id}">`;
        html += `${game.i18n.localize(item.name)}`;
        html += `</label>`
        html += `${item.system.description}</div>`;
      });
    }

    html += `</div>`;

    const data = await api.DialogV2.confirm({
      window: {title: `${game.i18n.localize('Add')} ${item_type}`},
      classes: ["synths-in-the-shadow"],
      content: html,
      yes: {
        icon: '<i class="fas fa-check"></i>',
        label: game.i18n.localize('Add'),
        callback: (event, button, dialog) => new ux.FormDataExtended(button.form).object
      },
      no: {
        label: game.i18n.localize('Cancel'),
      },
      rejectClose: false,
    });

    if (!data?.select_items) {
      return;
    }

    // Normalize dialog returns

    let ids_to_add = [];
    if (typeof data.select_items === 'object') {
      data.select_items.forEach((item) => {if (item) {ids_to_add.push(item);}})
    } else if (data.select_items) {
      ids_to_add.push(data.select_items);
    }

    // Turn IDs into actual item/actors

    let items_to_add = [];
    switch (item_type) {
      case 'unit':
      case 'npc':
        ids_to_add.forEach((id) => {
          let actor = game.actors.get(id);
          if (actor) {
            items_to_add.push(actor);
          }
        });
        break;
      default:
        ids_to_add.forEach((id) => {
          let item = game.items.get(id);
          if (item) {
            items_to_add.push(item);
          }
        });
        break;
    } 

    // Process items

    switch (item_type) {
      case 'unit':
        await SitsHelpers.addUnit(this.actor,items_to_add[0]);
        break;
      case 'npc':
        items_to_add.forEach((npc) => {
          SitsHelpers.addContact(this.actor, npc);
        });
        break;

      case 'playbook':
        await this._newPlaybook(items_to_add[0]);
      default:
        await Item.create(items_to_add, {parent: this.document});
        break;
    }

  }




  /* -------------------------------------------- */

  /**
   * Roll an Attribute die.
   */
  static async onRollAttribute(event, target) {
    const attribute_name = target.getAttribute("data-roll-attribute");
    this.actor.rollAttributePopup(attribute_name);
  }

  /* -------------------------------------------- */
  
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

  static async onRadioToggleSingle(event, target) {
    event.preventDefault();
    let labelID = target.getAttribute("for");
    target = document.getElementById(labelID);


    target.click();
    
  }	

}