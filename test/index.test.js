import assert from 'node:assert/strict'
import { test } from 'vitest'

import {
  HUBS,
  MODULES,
  SPECIES,
  TAXONOMIES,
  getBasePathForModule,
  getModuleById,
  getModulesForHub,
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

test('returns the registered path for a module', () => {
  assert.equal(getBasePathForModule('cattle-register'), '/cattle/register')
})

test('throws when looking up the base path for an unknown module', () => {
  assert.throws(
    () => getBasePathForModule('unknown'),
    /No module registered with id "unknown"/
  )
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
