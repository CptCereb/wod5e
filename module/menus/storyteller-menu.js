/* global game, WOD5E, FormApplication, foundry, renderTemplate, Dialog */

export class StorytellerMenu extends FormApplication {
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: 'Storyteller Settings',
      id: 'wod5e-storyteller',
      classes: ['wod5e'],
      template: 'systems/vtm5e/templates/ui/storyteller-menu.hbs',
      width: 500,
      height: 450,
      resizable: true,
      closeOnSubmit: true,
      tabs: [{
        navSelector: '.sheet-tabs',
        contentSelector: '.sheet-body',
        initial: 'modifications'
      }]
    })
  }

  /* -------------------------------------------- */

  /** @override */
  async getData () {
    const data = await super.getData()

    data.attributeTypes = {
      physical: 'WOD5E.SPC.Physical',
      social: 'WOD5E.SPC.Social',
      mental: 'WOD5E.SPC.Mental'
    }

    // Grab the modifications from the game settings and add them to the application data
    data.attributeModifications = game.settings.get('vtm5e', 'modifiedAttributes')
    data.skillModifications = game.settings.get('vtm5e', 'modifiedSkills')

    // Grab the custom attributes from the game settings and add them to the application data
    data.customAttributes = game.settings.get('vtm5e', 'customAttributes')

    return data
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners (html) {
    html.find('.add-mod-button').click(function (event) {
      event.preventDefault()

      const data = event.target.dataset
      const type = data.type

      _onGeneratePrompt(type)
    })

    html.find('.remove-mod-button').click(function (event) {
      event.preventDefault()

      const data = event.target.dataset
      const type = data.type
      const id = data.id

      _onRemoveChange(type, id)
    })

    html.find('.add-custom-button').click(function (event) {
      event.preventDefault()

      const data = event.target.dataset
      const type = data.type

      // Get the list of custom attributes
      const customAttributes = game.settings.get('vtm5e', 'customAttributes')

      // Define the new attribute and push it to the list
      const newAttribute = {
        id: foundry.utils.randomID(8),
        label: 'New Attribute',
        type: 'physical'
      }
      customAttributes.push(newAttribute)

      console.log(customAttributes)

      // Set the new list of attributes
      game.settings.set('vtm5e', 'customAttributes', customAttributes)
    })

    html.find('.remove-custom-button').click(function (event) {
      event.preventDefault()

      const data = event.target.dataset
      const type = data.type
      const id = data.id

      _onRemoveCustom(type, id)
    })

    html.find('.save-modifications').click(function (event) {
      event.preventDefault()

      const attributeModifications = []
      const customAttributes = []
      const skillModifications = []

      // Modifications to existing features
      html.find('.modification-row').each(function () {
        const featureMod = $(this)[0]
        const id = featureMod.dataset.id
        const type = featureMod.dataset.type
        const label = featureMod.dataset.label

        const rename = $(this).find('.mod-rename')[0].value
        const hidden = $(this).find('.mod-hidden')[0].checked

        if (type === 'attribute') {
          attributeModifications.push({
            id,
            rename,
            label,
            hidden
          })
        } else if (type === 'skill') {
          skillModifications.push({
            id,
            rename,
            label,
            hidden
          })
        }
      })

      // Custom additions to existing features
      html.find('.customization-row').each(function () {
        const customFeature = $(this)[0]
        const id = customFeature.dataset.id
        const type = customFeature.dataset.type

        const label = $(this).find('.label')[0].value
        const attrType = $(this).find('.attr-type')[0].value

        if (type === 'attribute') {
          customAttributes.push({
            id,
            type: attrType,
            label
          })
        }/* else if (type === 'skill') {
          #customSkills.push({
            id,
            type,
            label
          })
        }*/
      })

      // Save the new settings
      game.settings.set('vtm5e', 'modifiedAttributes', attributeModifications)
      game.settings.set('vtm5e', 'customAttributes', customAttributes)
      game.settings.set('vtm5e', 'modifiedSkills', skillModifications)
    })
  }
}

// Function for getting the information necessary for the selection dialog
async function _onGeneratePrompt (type) {
  if (type === 'attribute') {
    const attributesList = WOD5E.Attributes.getList()

    // Render the dialog
    _onRenderPromptDialog('attribute', attributesList, game.i18n.localize('WOD5E.Attributes.Label'))
  } else if (type === 'skill') {
    const skillsList = WOD5E.Skills.getList()

    // Render the dialog
    _onRenderPromptDialog('skill', skillsList, game.i18n.localize('WOD5E.Skills.Label'))
  }
}

// Function for rendering the dialog for adding a new modification
async function _onRenderPromptDialog (type, list, title) {
  // Render the template
  const template = 'systems/vtm5e/templates/ui/select-dialog.hbs'
  const content = await renderTemplate(template, { list })

  new Dialog(
    {
      title,
      content,
      buttons: {
        add: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize('WOD5E.Add'),
          callback: async html => {
            // Grab the id from the select element
            const id = html.find('[id=optionSelect]').val()
            // Define the label
            const label = list.filter(item => item.id === id)[0].label

            if (type === 'attribute') {
              // Get the list of modified attributes
              const modifiedAttributes = game.settings.get('vtm5e', 'modifiedAttributes')

              // Define the new attribute and push it to the list
              const newAttribute = {
                id,
                label,
                rename: '',
                hidden: false
              }
              modifiedAttributes.push(newAttribute)

              // Set the new list of attributes
              game.settings.set('vtm5e', 'modifiedAttributes', modifiedAttributes)
            } else if (type === 'skill') {
              // Get the list of modified skills
              const modifiedSkills = game.settings.get('vtm5e', 'modifiedSkills')

              // Define the new skill and push it to the list
              const newSkill = {
                id,
                label,
                rename: '',
                hidden: false
              }
              modifiedSkills.push(newSkill)

              // Set the new list of skills
              game.settings.set('vtm5e', 'modifiedSkills', modifiedSkills)
            }
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('WOD5E.Cancel')
        }
      },
      default: 'add'
    }
  ).render(true)
}

// Function for removing a change
async function _onRemoveChange (type, id) {
  if (type === 'attribute') {
    // Get the list of modified attributes
    let modifiedAttributes = game.settings.get('vtm5e', 'modifiedAttributes')

    // Remove the attribute by id then update the game settings
    modifiedAttributes = modifiedAttributes.filter(attribute => (attribute.id !== id))
    game.settings.set('vtm5e', 'modifiedAttributes', modifiedAttributes)
  } else if (type === 'skill') {
    // Get the list of modified skills
    let modifiedSkills = game.settings.get('vtm5e', 'modifiedSkills')

    // Remove the skill by id then update the game settings
    modifiedSkills = modifiedSkills.filter(skill => (skill.id !== id))
    game.settings.set('vtm5e', 'modifiedSkills', modifiedSkills)
  }
}
