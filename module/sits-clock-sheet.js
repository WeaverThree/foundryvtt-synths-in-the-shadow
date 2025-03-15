
import { SitsSheet } from "./sits-sheet.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {SitsSheet}
 */
export class SitsClockSheet extends SitsSheet {

  static DEFAULT_OPTIONS = {
    classes: ["synths-in-the-shadow"],
    position: {
      width: 360,
      height: 400,
    },
    actions: {
    }
  }
  
  static PARTS = {
    npcsheet: {
      id: "npc-sheet",
      template: "systems/synths-in-the-shadow/templates/actors/clock-sheet.hbs",
      scrollable: ["window-content"],
    }
  }

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext( options );

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

    /* -------------------------------------------- */

  /** 
   * I'm using this function to cause updates to happen to tokens and img after the user clicks the
   * form. I'm not sure if this is a good place/way to do it. 
   * @override 
   **/
  async _processSubmitData(event, form, submitData, options={}) {
    await super._processSubmitData(event, form, submitData, options)

    let image_path = `systems/synths-in-the-shadow/themes/${this.actor.system.color}/${this.actor.system.type}clock_${Math.min(this.actor.system.value, this.actor.system.type)}.svg`;

    await this.actor.update({
      img: image_path,
      prototypeToken: {texture: {src: image_path}},
    })

    let data = [];
    let update = {
      "texture.src": image_path,
      "name": this.actor.name,
    };

    let tokens = this.actor.getActiveTokens();
    tokens.forEach( function( token ) {
      data.push(
        foundry.utils.mergeObject(
          { _id: token.id },
          update
        )
      );
    });
    if(game.scenes.current){
      await TokenDocument.updateDocuments( data, { parent: game.scenes.current } )
    }

    // Update the Actor
    //return this.object.update(submitData);
  }

  /* -------------------------------------------- */

}
