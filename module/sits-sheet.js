import { SitsActiveEffect } from "./sits-active-effect.js";
import { SitsHelpers } from "./sits-helpers.js";

const {api, sheets} = foundry.applications;

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

    let input_type = "checkbox";

    if (typeof distinct !== "undefined") {
      input_type = "radio";
    }

    let items = await SitsHelpers.getAllItemsByType(item_type, game);

    let html = `<div class="items-to-add">`;

    items.forEach(e => {
      let addition_price_load = ``;

      if (typeof e.system.load !== "undefined") {
        addition_price_load += `(${e.system.load})`
      } else if (typeof e.system.price !== "undefined") {
        addition_price_load += `(${e.system.price})`
      }

      html += `<input id="select-item-${e._id}" type="${input_type}" name="select_items" value="${e._id}">`;
      html += `<label class="flex-horizontal" for="select-item-${e._id}">`;
      html += `${game.i18n.localize(e.name)} ${addition_price_load} <i class="fas fa-question-circle" data-tooltip="${game.i18n.localize(e.system.description)}"></i>`;
      html += `</label>`;
    });

    html += `</div>`;

    let options = {
      // width: "500"
    }

    // FIXME: DialogV2
    let dialog = new Dialog({
      title: `${game.i18n.localize('Add')} ${item_type}`,
      content: html,
      buttons: {
        one: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize('Add'),
          callback: async (html) => await this.addItemsToSheet(item_type, $(html).find('.items-to-add'))
        },
        two: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('Cancel'),
          callback: () => false
        }
      },
      default: "two"
    }, options);

    dialog.render(true);
  }


  /* -------------------------------------------- */

  async addItemsToSheet(item_type, el) {

    let items = await SitsHelpers.getAllItemsByType(item_type, game);
    let items_to_add = [];
    el.find("input:checked").each(function() {
      items_to_add.push(items.find(e => e._id === $(this).val()));
    });

    if (item_type == "unit") {
		let actor = this.actor;
      await SitsHelpers.addUnit(actor,items_to_add[0]);
    } else if (item_type == "playbook") {
      await this._newPlaybook(items_to_add[0]);
    } else {
      await Item.create(items_to_add, {parent: this.document});
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

  async _onUpdateBoxClick(event) {
    event.preventDefault();
    const item_id = $(event.currentTarget).data("item");
    var update_value = $(event.currentTarget).data("value");
      const update_type = $(event.currentTarget).data("utype");
      if ( update_value === undefined) {
      update_value = document.getElementById('fac-' + update_type + '-' + item_id).value;
    };
    var update;
    if ( update_type === "status" ) {
      update = {_id: item_id, system:{status:{value: update_value}}};
    }
    else if (update_type == "hold") {
      update = {_id: item_id, system:{hold:{value: update_value}}};
    } else {
      console.log("update attempted for type undefined in sits-sheet.js onUpdateBoxClick function");
      return;
    };

    await this.actor.updateEmbeddedDocuments("Item", [update]);


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