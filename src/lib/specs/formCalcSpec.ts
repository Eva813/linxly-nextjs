export const formMenuSpec = {
  type: "calc",
    named: {
      trim: {
        type: [ 
          "yes",
          "no",
          "left",
          "right"
        ],
        config: {
          insensitive: false
        },
        priority: -0.99,
        placeholder: "yes",
        description: "Trim whitespace around the command",
        typeError: "\"trim\" must be one of \"yes\", \"no\", \"left\" or \"right\""
      },
      format: {
        type: "numeric_format",
        priority: 1,
        placeholder: ",",
        description: "Formats the numeric results"
      }
    },
    commandName: "=",
  // "attributes": [
  //   {
  //     "name": "formula",
  //     "fillIn": false,
  //     "positional": true,
  //     "raw": "`324`",
  //     "value": "`324`",
  //     "nodes": []
  //   }
  // ]
}
