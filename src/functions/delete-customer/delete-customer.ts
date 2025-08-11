import { DynamoDBClient,DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";    
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Customer } from "../../dto/customer/customer";
const client = new DynamoDBClient();
export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => { 
  try {
    if (!event.pathParameters || !event.pathParameters.id) {
      throw new Error("No customerId provided");
    }

    const customerId = event.pathParameters.id;
    const deleteCommand = new DeleteItemCommand({
      TableName: "leighton-crm-table",
      Key: {
        pk: { S: `CUSTOMER#${customerId}` },
        sk: { S: `CUSTOMER#${customerId}` },
      },
    });

    await client.send(deleteCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Customer deleted successfully" }),
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