export const formMenuSpec = {
  positional: [0, 0],
  named: {
    name: {
      priority: 2,
      description: "Name of the form field",
      placeholder: "Label",
      type: "string",
      static: true
    },
    defaultValue: {
      type: "string",
      constant: true,
      priority: 2,
      placeholder: "Placeholder",
      description: "The default value for the field"
    },
    multiple: {
      type: "boolean",
      constant: true,
      priority: 1.4,
      placeholder: "yes",
      "description": "Whether the user can select multiple items"
    },
    option: {
      type: "string",
      list: "positional",
      priority: -1,
      description: "The menu options"
    }
  }
}
