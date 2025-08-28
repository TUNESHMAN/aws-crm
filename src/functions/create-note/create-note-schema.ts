export const schema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Note",
  type: "object",
  properties: {
    title: {
      type: "string",
      minLength: 1,
    },
    content: {
      type: "string",
      minLength: 1,
    },
    entityType: {
      type: "string",
      enum: ["Contact", "Lead", "Opportunity", "Account"],
    },
    isPrivate: {
      type: "boolean",
      default: false,
    },
  },
  required: ["title", "content", "entityType"],
};
