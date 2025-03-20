/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Atropos
 * Software License: GNU GPLv3
 */

// Import Modules
import { registerSystemSettings } from "./settings.js";
import { preloadHandlebarsTemplates } from "./sits-templates.js";
import { sitsRoll, simpleRollPopup } from "./sits-roll.js";
import { SitsHelpers } from "./sits-helpers.js";
import { SitsActor } from "./sits-actor.js";
import { SitsItem } from "./sits-item.js";
import { SitsItemSheet } from "./sits-item-sheet.js";
import { SitsAgentSheet } from "./sits-agent-sheet.js";
import { SitsFactionSheet } from "./sits-faction-sheet.js";
import { SitsUnitSheet } from "./sits-unit-sheet.js";
import { SitsClockSheet } from "./sits-clock-sheet.js";
import { SitsNPCSheet } from "./sits-npc-sheet.js";
import { SitsActiveEffect } from "./sits-active-effect.js";

window.SitsHelpers = SitsHelpers;



/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */
Hooks.once("init", async function() {
  console.log(`Initializing Synths in the Shadow System`);

  game.sits = {
    dice: sitsRoll,
	roller: simpleRollPopup
  };
  game.system.sitsClocks = {
    sizes: [ 4, 5, 6, 8, 10, 12, 16 ]
  };

  game.system.malfunctions = [ "cold", "haunted", "obsessed", "paranoid", "reckless", "soft", "unstable", "vicious" ];

  CONFIG.Item.documentClass = SitsItem;
  CONFIG.Actor.documentClass = SitsActor;
  CONFIG.ActiveEffect.documentClass = SitsActiveEffect;

  // Register System Settings
  registerSystemSettings();

  // Register sheet application classes
  foundry.documents.collections.Actors.unregisterSheet("core", ActorSheet);
  foundry.documents.collections.Actors.registerSheet("sits", SitsAgentSheet, { types: ["agent"], makeDefault: true });
  foundry.documents.collections.Actors.registerSheet("sits", SitsUnitSheet, { types: ["unit"], makeDefault: true });
  foundry.documents.collections.Actors.registerSheet("sits", SitsClockSheet, { types: ["clock"], makeDefault: true });
  foundry.documents.collections.Actors.registerSheet("sits", SitsNPCSheet, { types: ["npc"], makeDefault: true });
  foundry.documents.collections.Actors.registerSheet("sits", SitsFactionSheet, { types: ["faction"], makeDefault: true });
  foundry.documents.collections.Items.unregisterSheet("core", ItemSheet);
  foundry.documents.collections.Items.registerSheet("sits", SitsItemSheet, {makeDefault: true});
  await preloadHandlebarsTemplates();

  foundry.documents.collections.Actors.registeredSheets.forEach(element => console.log(element.Actor.name));


  // Is the value Turf side.
  Handlebars.registerHelper('is_turf_side', function(value, options) {
    if (["left", "right", "top", "bottom"].includes(value)) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

  // Multiboxes.
  Handlebars.registerHelper('multiboxes', function(selected, options) {

    let html = options.fn(this);

    // Fix for single non-array values.
    if ( !Array.isArray(selected) ) {
      selected = [selected];
    }

    if (typeof selected !== 'undefined') {
      selected.forEach(selected_value => {
        if (selected_value !== false) {
          let escapedValue = RegExp.escape(Handlebars.escapeExpression(selected_value));
          let rgx = new RegExp(' value=\"' + escapedValue + '\"');
          let oldHtml = html;
          html = html.replace(rgx, "$& checked");
          while( ( oldHtml === html ) && ( escapedValue >= 0 ) ){
            escapedValue--;
            rgx = new RegExp(' value=\"' + escapedValue + '\"');
            html = html.replace(rgx, "$& checked");
          }
        }
      });
    }
    return html;
  });

  // Malfunction Counter
  Handlebars.registerHelper('malfunctioncounter', function(itemlist, options) {

    let html = options.fn(this);
    var count = itemlist?.reduce((n,item) => item.type === 'malfunction' ? n+1 : n, 0);

    const rgx = new RegExp(' value=\"' + count + '\"');
    return html.replace(rgx, "$& checked");

  });

  // NotEquals handlebar.
  Handlebars.registerHelper('noteq', (a, b, options) => {
    return (a !== b) ? options.fn(this) : '';
  });

  //Less than comparison
  Handlebars.registerHelper('lteq', (a, b) => {
    return (a <= b);
  });

  //Greater than comparison
  Handlebars.registerHelper('gteq', (a, b) => {
    return (a >= b);
  });

  Handlebars.registerHelper('oneless', (a) => {
    return (a - 1);
  });

	//Reputation and Turf Bar on Unit Sheet
    Handlebars.registerHelper('repturf', (_id, turfs_amount, max_rep, options) => {

    let html = options.fn(this);
	var turfs_amount_int = parseInt(turfs_amount);
    for (let i = 1; i <= max_rep; i++) {

      if (i > max_rep - turfs_amount_int) {
		  html += `<input disabled type="radio" id="unit-${_id}-reputation-${i}" name="system.reputation" value="${i} dtype="Radio"><label style="background-image: url('systems/synths-in-the-shadow/styles/assets/teeth/stresstooth-black.png')" class="radio-toggle" for="unit-${_id}-reputation-${i}"></label>`;
	  } else {
	  html += `<input type="radio" id="unit-${_id}-reputation-${i}" name="system.reputation" value="${i}" dtype="Radio"><label class="radio-toggle" for="unit-${_id}-reputation-${i}"></label>`;
	  }
	}

    return html;
  });

  // Enrich the HTML replace /n with <br>
  Handlebars.registerHelper('html', (options) => {

    let text = options.hash['text'].replace(/\n/g, "<br />");

    return new Handlebars.SafeString(text);
  });

  // times_from_1 left as legacy code to not break Alternate Sheets compatibility
  Handlebars.registerHelper('times_from_1', function(n, block) {

    var accum = '';
    for (var i = 1; i <= n; ++i) {
      accum += block.fn(i);
    }
    return accum;
  });

  // times_from_0 left as legacy code to not break Alternate Sheets compatibility
  Handlebars.registerHelper('times_from_0', function(n, block) {

    var accum = '';
    for (var i = 0; i <= n; ++i) {
      accum += block.fn(i);
    }
    return accum;
  });

  // "N Times" loop for handlebars.
  //  Block is executed N times starting from start.
  //
  // Usage:
  // {{#times_from 1 10}}
  //   <span>{{this}}</span>
  // {{/times_from}}
  Handlebars.registerHelper('times_from', function(start, n, block) {

    let accum = '';
    for (let i = start; i <= n; ++i) {
      accum += block.fn(i);
    }
    return accum;
  });

  // Concat helper
  // https://gist.github.com/adg29/f312d6fab93652944a8a1026142491b1
  // Usage: (concat 'first 'second')
  Handlebars.registerHelper('concat', function() {
    var outStr = '';
    for(var arg in arguments){
        if(typeof arguments[arg]!='object'){
            outStr += arguments[arg];
        }
    }
    return outStr;
  });


  /**
   * @inheritDoc
   * Takes label from Selected option instead of just plain value.
   */

  Handlebars.registerHelper('selectOptionsWithLabel', function(choices, options) {

    const localize = options.hash['localize'] ?? false;
    let selected = options.hash['selected'] ?? null;
    let blank = options.hash['blank'] || null;
    selected = selected instanceof Array ? selected.map(String) : [String(selected)];

    // Create an option
    const option = (key, object) => {
      if ( localize ) object.label = game.i18n.localize(object.label);
      let isSelected = selected.includes(key);
      html += `<option value="${key}" ${isSelected ? "selected" : ""}>${object.label}</option>`
    };

    // Create the options
    let html = "";
    if ( blank ) option("", blank);
    Object.entries(choices).forEach(e => option(...e));

    return new Handlebars.SafeString(html);
  });


  /**
   * Create appropriate Sits clock
   */
  // Clocks in color for Clock Actors
  Handlebars.registerHelper('sits-clock-color', function(parameter_name, type, color, current_value, uniq_id) {

    let html = '';

    if (current_value === null || current_value === 'null') {
      current_value = 0;
    }
	if (color === undefined) {
      color = "black";
    }

    if (parseInt(current_value) > parseInt(type)) {
      current_value = type;
    }

    html += `<div id="sits-clock-${uniq_id}" class="sits-clock clock-${type} clock-${type}-${current_value}" style="background-image:url('systems/synths-in-the-shadow/themes/${color}/${type}clock_${current_value}.svg');">`;

    let zero_checked = (parseInt(current_value) === 0) ? 'checked' : '';
    html += `<input type="radio" value="0" id="clock-0-${uniq_id}}" data-dType="String" name="${parameter_name}" ${zero_checked}>`;

    for (let i = 1; i <= parseInt(type); i++) {
      let checked = (parseInt(current_value) === i) ? 'checked' : '';
      html += `
        <input type="radio" value="${i}" id="clock-${i}-${uniq_id}" data-dType="String" name="${parameter_name}" ${checked}>
        <label data-action="radioToggle" class="radio-toggle" for="clock-${i}-${uniq_id}"></label>
      `;
    }

    html += `</div>`;
    return html;
  });
  
  Handlebars.registerHelper('pc', function( string ) {
    return SitsHelpers.getProperCase( string );
  });
  
  // check for game settings
  Handlebars.registerHelper('getSetting', function( string ) {
	  return (game.settings.get('synths-in-the-shadow', string));

  });
});

/**
 * Once the entire VTT framework is initialized, check to see if we should perform a data migration
 */
Hooks.once("ready", function() {
/**
  // Determine whether a system migration is required
  const currentVersion = game.settings.get("bitd", "systemMigrationVersion");
  const NEEDS_MIGRATION_VERSION = 2.15;

  let needMigration = (currentVersion < NEEDS_MIGRATION_VERSION) || (currentVersion === null);

  // Perform the migration
  if ( needMigration && game.user.isGM ) {
    migrations.migrateWorld();
  }
  **/
});

/*
 * Hooks
 */

// getSceneControlButtons
Hooks.on('getSceneControlButtons', controls => {
	
	if (foundry.utils.isNewerVersion(game.version,13)) {
		controls.tokens.tools.DiceRoller = {
			name: "DiceRoller",
			title: "BITD.DiceRoller",
			icon: "fas fa-dice",
			onChange: (event, active) => {
				simpleRollPopup();
			},
			button: true
		};		
	}
});
	
Hooks.on("renderSceneControls", async (app, html) => {	

	if (foundry.utils.isNewerVersion(13,game.version)) { 
	  let dice_roller = $('<li class="scene-control" data-tooltip="Dice Roll"><i class="fas fa-dice"></i></li>');
	  dice_roller.click( async function() {
		await simpleRollPopup();
	  });
	  html.children().first().append( dice_roller );
	}

});

