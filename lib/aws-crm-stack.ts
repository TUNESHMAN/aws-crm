import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
export class AwsCrmStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'AwsCrmQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    const createCustomerLambda = new NodejsFunction(
      this,
      'CreateCustomerLambda',
      {
        functionName: 'create-customer',
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: path.join(
          __dirname,
          '../src/functions/create-customer/create-customer.ts',
        ),
        logRetention: logs.RetentionDays.ONE_DAY,
        handler: 'handler',
        memorySize: 1024,
        architecture: lambda.Architecture.ARM_64,
        tracing: lambda.Tracing.ACTIVE,
        timeout: cdk.Duration.seconds(5),
        bundling: {
          minify: true,
        },
      },
    );

    // Get customer Lambda function
    const getCustomerLambda = new NodejsFunction(
      this,
      'GetCustomerLambda',
      {
        functionName: 'get-customer',
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: path.join(
          __dirname,
          '../src/functions/get-customer/get-customer.ts',
        ),
        logRetention: logs.RetentionDays.ONE_DAY,
        handler: 'handler',
        memorySize: 1024,
        architecture: lambda.Architecture.ARM_64,
        tracing: lambda.Tracing.ACTIVE,
        timeout: cdk.Duration.seconds(5),
        bundling: {
          minify: true,
        },
      },
    );

    // Delete customer Lambda function
    const deleteCustomerLambda = new NodejsFunction(
      this,
      'DeleteCustomerLambda',
      {
        functionName: 'delete-customer',
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: path.join(
          __dirname,
          '../src/functions/delete-customer/delete-customer.ts',
        ),
        logRetention: logs.RetentionDays.ONE_DAY,
        handler: 'handler',
        memorySize: 1024,
        architecture: lambda.Architecture.ARM_64,
        tracing: lambda.Tracing.ACTIVE,
        timeout: cdk.Duration.seconds(5),
        bundling: {
          minify: true,
        },
      },
    );

    // Get all customers Lambda function
    const getAllCustomersLambda = new NodejsFunction(
      this,
      'GetAllCustomersLambda',
      {
        functionName: 'get-all-customers',
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: path.join(
          __dirname,
          '../src/functions/get-all-customers/get-all-customers.ts',
        ),
        logRetention: logs.RetentionDays.ONE_DAY,
        handler: 'handler',
        memorySize: 1024,
        architecture: lambda.Architecture.ARM_64,
        tracing: lambda.Tracing.ACTIVE,
        timeout: cdk.Duration.seconds(5),
        bundling: {
          minify: true,
        },
      },
    );
    // Create customer note Lambda function
    const createCustomerNoteLambda = new NodejsFunction(
      this,
      'CreateCustomerNoteLambda',
      {
        functionName: 'create-note',
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: path.join(
          __dirname,
          '../src/functions/create-note/create-note.ts',
        ),
        logRetention: logs.RetentionDays.ONE_DAY,
        handler: 'handler',
        memorySize: 1024,
        architecture: lambda.Architecture.ARM_64,
        tracing: lambda.Tracing.ACTIVE,
        timeout: cdk.Duration.seconds(5),
        bundling: {
          minify: true,
        },
      },
    );
    // Get all notes Lambda function
    const getAllNotesLambda = new NodejsFunction(
      this,
      'GetAllNotesLambda',
      {
        functionName: 'get-all-notes',
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: path.join(
          __dirname,
          '../src/functions/get-all-notes/get-all-notes.ts',
        ),
        logRetention: logs.RetentionDays.ONE_DAY,
        handler: 'handler',
        memorySize: 1024,
        architecture: lambda.Architecture.ARM_64,
        tracing: lambda.Tracing.ACTIVE,
        timeout: cdk.Duration.seconds(5),
        bundling: {
          minify: true,
        },
      },
    );
    // Get note Lambda function
    const getNoteLambda = new NodejsFunction(
      this,
      'GetNoteLambda',
      {
        functionName: 'get-note',
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: path.join(
          __dirname,
          '../src/functions/get-note/get-note.ts',
        ),
        logRetention: logs.RetentionDays.ONE_DAY,
        handler: 'handler',
        memorySize: 1024,
        architecture: lambda.Architecture.ARM_64,
        tracing: lambda.Tracing.ACTIVE,
        timeout: cdk.Duration.seconds(5),
        bundling: {
          minify: true,
        },
      },
    );
    // add the API for communicating with our CRM system
    const api = new apigw.RestApi(this, 'Api', {
      description: 'Leighton CRM system',
      restApiName: `leighton-crm-service`,
      endpointTypes: [apigw.EndpointType.EDGE],
      deploy: true,
      deployOptions: {
        stageName: 'api',
      },
    });
    // we create the dynamodb table to store our data
    const table = new dynamodb.Table(this, 'Table', {
      partitionKey: {
        name: 'pk',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'sk',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: 'leighton-crm-table',
    });
    const root: apigw.Resource = api.root.addResource('v1');
    const customers: apigw.Resource = root.addResource('customers');
    const notes: apigw.Resource = customers.addResource('notes');
    // hook up the lambda function to the post request on /customers
    customers.addMethod(
      'POST',
      new apigw.LambdaIntegration(createCustomerLambda, {
        proxy: true,
      }),
    );
    const customerById = customers.addResource('{id}')
    customerById.addMethod(
      'GET',
      new apigw.LambdaIntegration(getCustomerLambda, {
        proxy: true,
      }),
    );
    customers.addMethod(
      'DELETE',
      new apigw.LambdaIntegration(deleteCustomerLambda, {
        proxy: true,
      }),
    );
    customers.addMethod(
      'GET',
      new apigw.LambdaIntegration(getAllCustomersLambda, {
        proxy: true,
      }),
    );
    notes.addMethod(
      'POST',
      new apigw.LambdaIntegration(createCustomerNoteLambda, {
        proxy: true,
      }),
    );
    notes.addMethod(
      'GET',
      new apigw.LambdaIntegration(getAllNotesLambda, {
        proxy: true,
      }),
    );
    const noteById = notes.addResource('{id}');
    noteById.addMethod(
      'GET',
      new apigw.LambdaIntegration(getNoteLambda, {
        proxy: true,
      }),
    );
    // allow the Lambda function to write to the table
    table.grantWriteData(createCustomerLambda);
    table.grantReadData(getCustomerLambda);
    table.grantWriteData(deleteCustomerLambda);
    table.grantReadData(getAllCustomersLambda);
    table.grantWriteData(createCustomerNoteLambda);
    table.grantReadData(getAllNotesLambda);
    // add GSI
    // we add a GSI to support querying all customers by type
    table.addGlobalSecondaryIndex({
      indexName: 'gsi1',
      partitionKey: {
        name: 'type',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'created',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });
  }
}

