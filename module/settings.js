export const registerSystemSettings = function() {

  /**
   * Track the system version upon which point a migration was last applied
   */
  game.settings.register("bitd", "systemMigrationVersion", {
    name: "System Migration Version",
    scope: "world",
    config: false,
    type: Number,
    default: 0
  });
  
  /*
  if (foundry.utils.isNewerVersion(game.version, 12)) {

    game.settings.register('blades-in-the-dark', 'ActionRoll', {
	name: game.i18n.localize('BITD.Settings.Action.Name'),
	hint: game.i18n.localize('BITD.Settings.Action.Hint'),
	config: true,
	default: true,
	scope: 'world',
	type: new foundry.data.fields.BooleanField(),
	requiresReload: true
  });
  } //end if for game.version >12
	*/
 

};
