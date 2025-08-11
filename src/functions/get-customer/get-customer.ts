import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Customer } from "../../dto/customer/customer";
import { unmarshall } from "@aws-sdk/util-dynamodb";    
const client = new DynamoDBClient();
export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.pathParameters || !event.pathParameters.id) {
      throw new Error("No customerId provided");
    }

    const customerId = event.pathParameters.id;
    const getCommand = new GetItemCommand({
      TableName: "leighton-crm-table",
      Key: {
        pk: { S: `CUSTOMER#${customerId}` },
        sk: { S: `CUSTOMER#${customerId}` },
      },
    });

    const response = await client.send(getCommand);
    if (!response.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Customer not found" }),
      };
    }

    const customer = unmarshall(response.Item) as Customer;

    return {
      statusCode: 200,
      body: JSON.stringify(customer),
    };
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMessage }),
    };
  }
}