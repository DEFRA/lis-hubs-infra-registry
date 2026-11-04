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
 * The URL patterns the hubs mount a module on, keyed by mount name (for
 * example `holding` and `animal`). Patterns use hapi parameter syntax.
 *
 * @param {string} moduleId
 * @returns {Record<string, string>}
 */
export function getMountsForModule(moduleId) {
  const module = getModuleById(moduleId)

  if (!module) {
    throw new Error(`No module registered with id "${moduleId}"`)
  }

  return module.mounts
}

const mountParamPattern = /\{(\w+)(\*\d*)?}/g

/**
 * Fills a module's mount pattern with values, giving the concrete path the
 * hub serves it on: `getMountPath('cattle-home', 'holding', { cph: '12/345/0001' })`
 * is `/holdings/12/345/0001/cattle`.
 *
 * @param {string} moduleId
 * @param {string} mountName
 * @param {Record<string, string>} [params] a value for every parameter in the pattern
 * @returns {string}
 */
export function getMountPath(moduleId, mountName, params = {}) {
  const pattern = getMountsForModule(moduleId)[mountName]

  if (!pattern) {
    throw new Error(`Module "${moduleId}" has no mount named "${mountName}"`)
  }

  return pattern.replace(mountParamPattern, (_, name) => {
    const value = params[name]

    if (value === undefined || value === '') {
      throw new Error(
        `Mount "${mountName}" of module "${moduleId}" needs a value for "${name}"`
      )
    }

    return value
  })
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
