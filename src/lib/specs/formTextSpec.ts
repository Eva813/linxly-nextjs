export const formTextSpec = {
  positional: [0, 0],
  named: {
    name: {
      priority: 2,
      description: "Name of the form field",
      placeholder: "Label",
      type: "string",
      static: true
    },
    // formatter: {
    //   priority: -1,
    //   description: "Function formatting the value of the form field",
    //   placeholder: "(value) -> upper(value)",
    //   type: "lambda"
    // },
    // cols: {
    //   type: "number",
    //   priority: 1.5,
    //   placeholder: "20",
    //   description: "The width of the field in columns of text",
    //   config: { minimum: 0, isMultiple: false }
    // },
    // width: {
    //   priority: -10,
    //   type: "number"
    // },
    defaultValue: {
      type: "string",
      constant: true,
      priority: 2,
      placeholder: "Placeholder",
      description: "The default value for the field"
    }
  }
}
