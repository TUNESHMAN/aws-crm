import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { Note } from "../../dto/note/note";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient();

export const handler = async (
    event: APIGatewayProxyEvent
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
                ':typeVal': { S: 'NOTE' },
            },
            ScanIndexForward: false,

        });

        const response = await client.send(queryCommand);
        const notes = response.Items?.map((item) => unmarshall(item) as Note) || [];

        return {
            statusCode: 200,
            body: JSON.stringify(notes),
        };
    } catch (error) {
        let errorMessage = "Unknown error";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        console.error("Error fetching notes:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to fetch notes" }),
        };
    }
};