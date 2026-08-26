import supportedTaxonomies from './supported-taxonomies.json' with { type: 'json' }
import supportedSpecies from './supported-species.json' with { type: 'json' }
import modules from './modules.json' with { type: 'json' }

export const HUBS = ['front-office', 'back-office']

export const TAXONOMIES = supportedTaxonomies

export const SPECIES = supportedSpecies

export const MODULES = modules

/**
 * @param {string} taxonomyId
 * @returns {object | null}
 */
export function getTaxonomyById(taxonomyId) {
  return TAXONOMIES.find(({ id }) => id === taxonomyId) ?? null
}

/**
 * @param {string} speciesCode
 * @returns {object | null}
 */
export function getSpeciesByCode(speciesCode) {
  return SPECIES.find(({ code }) => code === speciesCode) ?? null
}

/**
 * @param {string} moduleId
 * @returns {object | null}
 */
export function getModuleById(moduleId) {
  return MODULES.find(({ id }) => id === moduleId) ?? null
}

/**
 * @param {string} moduleId
 * @returns {string}
 */
export function getBasePathForModule(moduleId) {
  const module = getModuleById(moduleId)

  if (!module) {
    throw new Error(`No module registered with id "${moduleId}"`)
  }

  return module.path
}

/**
 * @param {string} hubId
 * @returns {object[]}
 */
export function getModulesForHub(hubId) {
  return MODULES.filter(({ hubs }) => hubs.includes(hubId))
}

/**
 * @param {object} module
 * @returns {object | null}
 */
export function hydrateModuleMetadata(module) {
  if (!module) {
    return null
  }

  const taxonomy = getTaxonomyById(module.taxonomy)
  const species = getSpeciesByCode(module.species)

  return {
    ...module,
    taxonomyLabel: taxonomy?.label ?? module.taxonomy,
    speciesLabel: species?.label ?? module.species
  }
}
