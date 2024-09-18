/* global game */

import { getBloodPotencyValues } from './blood-potency.js'

export const getVampireBonuses = async function (actorData) {
  const bloodPotency = await getBloodPotencyValues(actorData.blood.potency)

  const bonuses = [
    {
      source: game.i18n.localize('WOD5E.VTM.BloodPotency'),
      value: bloodPotency.power,
      paths: ['disciplines'],
      activeWhen: {
        check: 'always'
      }
    },
    {
      source: game.i18n.localize('WOD5E.VTM.BloodSurge'),
      value: bloodPotency.surge,
      paths: ['all'],
      unless: ['willpower', 'humanity', 'extended'],
      displayWhenInactive: true,
      activeWhen: {
        check: 'isPath',
        path: 'blood-surge'
      },
      advancedCheckDice: 1
    }
  ]

  return bonuses
}
