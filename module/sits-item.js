import { SitsHelpers } from "./sits-helpers.js";

/**
 * Extend the basic Item
 * @extends {Item}
 */
export class SitsItem extends Item {

  /** @override */
  async _preCreate( data, options, user ) {
    await super._preCreate( data, options, user );

    let removeItems = [];
    if( user.id === game.user.id ) {
      let actor = this.parent ? this.parent : null;
      if( actor?.documentName === "Actor" ) {
        removeItems = SitsHelpers.removeDuplicatedItemType( data, actor );
      }
      if( removeItems.length !== 0 ) {
        await actor.deleteEmbeddedDocuments( "Item", removeItems );
      }
    }
  }

  /** @override */
  static async create(data, options={}) {

    // For Unit and Agent set the Token to sync with charsheet.
    switch (data.type) {
      case 'item':
        this.DEFAULT_ICON = "systems/synths-in-the-shadow/styles/assets/icons/unit.svg";
        break;
      case 'playbook':
        this.DEFAULT_ICON = "systems/synths-in-the-shadow/styles/assets/gameicons/scales.svg";
        break;
      case 'ability':
        this.DEFAULT_ICON = "systems/synths-in-the-shadow/styles/assets/gameicons/robber-mask.svg";
        break;
      case 'maker':
        this.DEFAULT_ICON = "systems/synths-in-the-shadow/styles/assets/icons/agent.svg";
        break;
      case 'build':
        this.DEFAULT_ICON = "systems/synths-in-the-shadow/styles/assets/icons/unit.svg";
        break;
      case 'deviance':
        this.DEFAULT_ICON = "systems/synths-in-the-shadow/styles/assets/gameicons/scales.svg";
        break;
      case 'hunting_grounds':
        this.DEFAULT_ICON = "systems/synths-in-the-shadow/styles/assets/gameicons/robber-mask.svg";
        break;
      case 'unit_upgrade':
        this.DEFAULT_ICON = "systems/synths-in-the-shadow/styles/assets/icons/agent.svg";
        break;
      case 'unit_playbook':
        this.DEFAULT_ICON = "systems/synths-in-the-shadow/styles/assets/icons/unit.svg";
        break;
      case 'unit_reputation':
        this.DEFAULT_ICON = "systems/synths-in-the-shadow/styles/assets/gameicons/scales.svg";
        break;
      case 'unit_upgrade':
        this.DEFAULT_ICON = "systems/synths-in-the-shadow/styles/assets/gameicons/robber-mask.svg";
        break;
      case 'unit_ability':
        this.DEFAULT_ICON = "systems/synths-in-the-shadow/styles/assets/gameicons/robber-mask.svg";
        break;
      case 'malfunction':
        this.DEFAULT_ICON = "systems/synths-in-the-shadow/styles/assets/gameicons/robber-mask.svg";
        break;
    }

    return super.create(data, options);

  }

  /* -------------------------------------------- */

  /* override */
  prepareData() {

    super.prepareData();

    const item_data = this.system;
    
  }

  async sendToChat() {
    const itemData = this.toObject();
    if (itemData.img.includes("/mystery-man")) {
      itemData.img = null;
    }
    const html = await renderTemplate("systems/synths-in-the-shadow/templates/chat/chat-item.html", itemData);
    const chatData = {
      user: game.userId,
      content: html,
    };
    const message = await ChatMessage.create(chatData);
  }
}
