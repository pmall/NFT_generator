#!/usr/bin/env node
import { Command, InvalidArgumentError } from 'commander';
import { attributes } from './cmd/attributes';

const program = new Command()

program.description('Generate random collection of NFTs.');
program.name("nftg");
program.usage("[command]");
program.addHelpCommand(false);
program.helpOption(true);

program.command('attributes')
    .argument('<n>', 'The number of attribute lists to generate.', toInt)
    .argument('[root]', 'The directory containing the mapping.json file.', '.')
    .option('--no-unique', 'Allow to generate the same random list of attributes many times.')
    .description('Generate an attributes.json file containing <n> random lists of traits in [root] folder.')
    .action(attributes)

program.parse(process.argv);

function toInt(value: string) {
    const parsedValue = parseInt(value);

    if (isNaN(parsedValue)) {
        throw new InvalidArgumentError('Must be a number.');
    }

    return parsedValue;
}
