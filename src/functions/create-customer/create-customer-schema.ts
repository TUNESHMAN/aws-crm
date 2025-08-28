export const schema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Customer",
  type: "object",
  properties: {
    customerId: {
      type: "string",
    },
    firstName: {
      type: "string",
    },
    lastName: {
      type: "string",
    },
    email: {
      type: "string",
      format: "email",
    },
    phone: {
      type: "string",
    },
    company: {
      type: "string",
    },
    jobTitle: {
      type: "string",
    },
    address: {
      type: "object",
      properties: {
        street: {
          type: "string",
        },
        city: {
          type: "string",
        },
        state: {
          type: "string",
        },
        postalCode: {
          type: "string",
        },
        country: {
          type: "string",
        },
      },
      required: ["street", "city", "state", "postalCode", "country"],
    },
  },
  required: [
    "customerId",
    "firstName",
    "lastName",
    "email",
    "phone",
    "company",
    "jobTitle",
    "address",
  ],
};
