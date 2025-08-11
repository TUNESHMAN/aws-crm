import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Customer } from "../../dto/customer/customer";
import { unmarshall } from "@aws-sdk/util-dynamodb";
const client = new DynamoDBClient();
export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const queryCommand = new QueryCommand({
      TableName: "leighton-crm-table",
      IndexName: 'gsi1',
      KeyConditionExpression: '#type = :typeVal',
     ExpressionAttributeNames: {
        '#type': 'type',
      },
      ExpressionAttributeValues: {
        ':typeVal': { S: 'CUSTOMER' },
      },
      ScanIndexForward: false,
    });

    const response = await client.send(queryCommand);
    if (!response.Items || response.Items.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "No customers found" }),
      };
    }

    const customers = response.Items.map(item => unmarshall(item) as Customer);

    return {
      statusCode: 200,
      body: JSON.stringify(customers),
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