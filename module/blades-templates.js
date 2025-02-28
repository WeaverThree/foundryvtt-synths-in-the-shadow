/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {

  // Define template paths to load
  const templatePaths = [

    // Actor Sheet Partials
    "systems/synths-in-the-shadow/templates/parts/coins.html",
    "systems/synths-in-the-shadow/templates/parts/attributes.html",
    "systems/synths-in-the-shadow/templates/parts/turf-list.html",
    "systems/synths-in-the-shadow/templates/parts/cohort-block.html",
    "systems/synths-in-the-shadow/templates/parts/factions.html",
    "systems/synths-in-the-shadow/templates/parts/active-effects.html",
  ];

  // Load the template parts
  return loadTemplates(templatePaths);
};
