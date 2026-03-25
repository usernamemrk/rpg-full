import { SpellFX } from '../engine/SpellFX'

test('SpellFX instantiates without loading Phaser', () => {
  const fx = new SpellFX()
  expect(fx).toBeTruthy()
})
