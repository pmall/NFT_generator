#!/usr/bin/env node
import dotenv from 'dotenv'
import { Command, InvalidArgumentError } from 'commander';
import { stats } from './cmd/stats';
import { images } from './cmd/images';
import { pinata } from './cmd/pinata';
import { attributes } from './cmd/attributes';

dotenv.config()

const program = new Command()

program.description('Generate random collection of NFTs.');
program.name("nftg");
program.usage("[command]");
program.addHelpCommand(false);
program.helpOption(true);

program.command('attributes')
    .argument('<n>', 'The number of attribute lists to generate.', toInt)
    .argument('[dir]', 'The project directory.', '.')
    .option('--no-unique', 'Allow to generate the same random list of attributes many times.')
    .description('Generate an attributes.json file containing <n> random lists of traits in [dir] folder.')
    .action(attributes)

program.command('stats')
    .argument('[dir]', 'The project directory.', '.')
    .description('Compute stats from the attributes.json file contained in [dir] folder.')
    .action(stats)

program.command('images')
    .argument('[dir]', 'The project directory.', '.')
    .description('Generate images from the attributes.json file contained in [dir] folder.')
    .action(images)

program.command('pinata')
    .argument('[dir]', 'The project directory.', '.')
    .description('Upload images contained in [dir]/images folder to pinata.')
    .action(pinata)

program.parse(process.argv);

function toInt(value: string) {
    const parsedValue = parseInt(value);

    if (isNaN(parsedValue)) {
        throw new InvalidArgumentError('Must be a number.');
    }

    return parsedValue;
}
