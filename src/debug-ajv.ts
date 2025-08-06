import * as fs from 'fs';
import * as path from 'path';
import Ajv from 'ajv';
import betterAjvErrors from 'better-ajv-errors';
const chalk = require('chalk');

// Setup AJV with better debugging
const ajv = new Ajv({
    allErrors: true,
    verbose: true,
    jsonPointers: true,
    errorDataPath: 'property',
});

function debugValidation(schemaPath: string, jsonPath: string) {
    try {
        // Load schema and JSON
        const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        console.log(chalk.blue(`\n🔍 Validating: ${jsonPath}`));
        console.log(chalk.blue(`📋 Schema: ${schemaPath}\n`));

        // Compile schema
        const validate = ajv.compile(schema);

        // Validate
        const valid = validate(data);

        if (valid) {
            console.log(chalk.green('✅ Validation passed!'));
        } else {
            console.log(chalk.red('❌ Validation failed!\n'));

            // Show better errors
            const output = betterAjvErrors(schema, data, validate.errors, {
                format: 'cli',
                indent: 2,
            });

            console.log(output);

            // Also show raw AJV errors for debugging
            console.log(chalk.yellow('\n📝 Raw AJV Errors:'));
            console.log(JSON.stringify(validate.errors, null, 2));
        }
    } catch (error) {
        console.error(chalk.red('💥 Error:'), (error as any).message);
    }
}

// Usage examples - modify these paths as needed
const args = process.argv.slice(2);
if (args.length >= 2) {
    debugValidation(args[0], args[1]);
} else {
    // Try to use environment variables like the main script
    const schemaPath = process.env.INPUT_SCHEMA || process.env.SCHEMA;
    const jsonPath = process.env.INPUT_JSONS || process.env.JSONS;
    const workspace = process.env.GITHUB_WORKSPACE || '.';

    if (schemaPath && jsonPath) {
        const fullSchemaPath = path.join(workspace, schemaPath);
        const fullJsonPath = path.join(workspace, jsonPath);
        debugValidation(fullSchemaPath, fullJsonPath);
    } else {
        console.log(chalk.yellow('Usage: npm run debug:ajv <schema-path> <json-path>'));
        console.log(chalk.yellow('Example: npm run debug:ajv boards/schema.json boards/example/definition.json'));
        console.log(chalk.yellow('Or set environment variables: INPUT_SCHEMA, INPUT_JSONS, GITHUB_WORKSPACE'));
    }
}
