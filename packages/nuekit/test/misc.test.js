import { match } from '../src/browser/app-router.js'

import { parsePathParts } from '../src/util.js'
import { lightningCSS } from '../src/builder.js'
import { create } from '../src/create.js'
import { getArgs } from '../src/cli.js'

import { toMatchPath } from './match-path.js'

import { promises as fs } from 'node:fs'

expect.extend({ toMatchPath })

// temporary directory
const root = '_test'

// setup and teardown
beforeAll(async () => {
  await fs.rm(root, { recursive: true, force: true })
  await fs.mkdir(root, { recursive: true })
})

afterAll(async () => await fs.rm(root, { recursive: true, force: true }))

test('Lightning CSS errors', async () => {
  try {
    await lightningCSS('body margin: 0 }', true)
  } catch (e) {
    expect(e.lineText).toBe('body margin: 0 }')
    expect(e.line).toBe(1)
  }
})

test('Lightning CSS', async () => {
  const css = await lightningCSS('body { margin: 0 }', true)
  expect(css).toBe('body{margin:0}')
})

test('CLI args', () => {
  const args = getArgs(['nue', 'build', '--verbose', '-pnve', 'joku.yaml'])
  expect(args.env).toBe('joku.yaml')
  expect(args.dryrun).toBe(true)
  expect(args.verbose).toBe(true)
})

test('app router', async () => {
  expect(match('/fail/:id', '/users/20')).toBeNull()
  expect(match('/users/:id/edit', '/users/20')).toBeNull()
  expect(match('/users/:id', '/users/20')).toEqual({ id: 20 })
  expect(match('/:view/:id', '/users/20')).toEqual({ id: 20, view: 'users' })
})

test('path parts', () => {
  const parts = parsePathParts('docs/glossary/semantic-css.md')
  expect(parts.url).toBe('/docs/glossary/semantic-css.html')
  expect(parts.dir).toMatchPath('docs/glossary')
  expect(parts.basedir).toMatchPath('docs')
  expect(parts.slug).toBe('semantic-css.html')
})

test('create', async () => {
  const terminate = await create({ root, name: 'test' })
  terminate()

  const contents = await fs.readdir(root)
  expect(contents).toContain('index.md') // should be unpacked to correct dir
  expect(contents).toContain('.dist') // should be built
})
