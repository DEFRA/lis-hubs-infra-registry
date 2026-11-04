import assert from 'node:assert/strict'
import { test } from 'vitest'

import {
  HUBS,
  MODULES,
  SPECIES,
  TAXONOMIES,
  getModuleById,
  getModulesForHub,
  getMountPath,
  getMountsForModule,
  getSpeciesByCode,
  getTaxonomyById,
  hydrateModuleMetadata
} from '../src/index.js'

test('exports the supported hubs and registry data', () => {
  assert.deepEqual(HUBS, ['front-office', 'back-office'])
  assert.ok(MODULES.length > 0)
  assert.ok(SPECIES.length > 0)
  assert.ok(TAXONOMIES.length > 0)
})

test('looks up registry entries by their public identifiers', () => {
  assert.equal(getTaxonomyById('register')?.label, 'Register')
  assert.equal(getSpeciesByCode('ctt')?.label, 'Cattle')
  assert.equal(getModuleById('cattle-register')?.port, 3201)
})

test('returns null when a registry entry does not exist', () => {
  assert.equal(getTaxonomyById('unknown'), null)
  assert.equal(getSpeciesByCode('unknown'), null)
  assert.equal(getModuleById('unknown'), null)
})

test('filters modules by hub membership', () => {
  const frontOfficeModules = getModulesForHub('front-office')

  assert.ok(frontOfficeModules.length > 0)
  assert.ok(
    frontOfficeModules.every(({ hubs }) => hubs.includes('front-office'))
  )
  assert.deepEqual(getModulesForHub('unknown'), [])
})

test('hydrates module labels without mutating its metadata', () => {
  const module = getModuleById('cattle-register')

  assert.deepEqual(hydrateModuleMetadata(module), {
    ...module,
    taxonomyLabel: 'Register',
    speciesLabel: 'Cattle'
  })
  assert.equal('taxonomyLabel' in module, false)
})

test('returns the registered mounts for a module', () => {
  assert.deepEqual(getMountsForModule('cattle-home'), {
    holding: '/holdings/{cph*3}/cattle',
    animal: '/animals/cattle',
    assets: '/assets/cattle-home'
  })
  assert.deepEqual(getMountsForModule('cattle-register'), {
    holding: '/holdings/{cph*3}/cattle/register',
    assets: '/assets/cattle-register'
  })
})

test('throws when looking up the mounts for an unknown module', () => {
  assert.throws(
    () => getMountsForModule('unknown'),
    /No module registered with id "unknown"/
  )
})

test('fills a mount pattern with the given values', () => {
  assert.equal(
    getMountPath('cattle-home', 'holding', { cph: '12/345/0001' }),
    '/holdings/12/345/0001/cattle'
  )
  assert.equal(
    getMountPath('cattle-register', 'holding', { cph: '12/345/0001' }),
    '/holdings/12/345/0001/cattle/register'
  )
})

test('fills a mount pattern that has no parameters', () => {
  assert.equal(getMountPath('cattle-home', 'animal'), '/animals/cattle')
})

test('throws when a mount pattern parameter has no value', () => {
  assert.throws(
    () => getMountPath('cattle-home', 'holding'),
    /Mount "holding" of module "cattle-home" needs a value for "cph"/
  )
  assert.throws(
    () => getMountPath('cattle-home', 'holding', { cph: '' }),
    /needs a value for "cph"/
  )
})

test('throws when a module has no mount with the given name', () => {
  assert.throws(
    () => getMountPath('cattle-register', 'animal'),
    /Module "cattle-register" has no mount named "animal"/
  )
})

test('every module declares a holding mount and its own assets mount', () => {
  for (const module of MODULES) {
    assert.ok(module.mounts.holding, `${module.id} has no holding mount`)
    assert.equal(module.mounts.assets, `/assets/${module.id}`)
  }
})

test('hydrates unknown labels with their original identifiers', () => {
  assert.deepEqual(
    hydrateModuleMetadata({ taxonomy: 'other', species: 'other' }),
    {
      taxonomy: 'other',
      species: 'other',
      taxonomyLabel: 'other',
      speciesLabel: 'other'
    }
  )
  assert.equal(hydrateModuleMetadata(null), null)
})
