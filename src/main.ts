#!/usr/bin/env node
import fs from 'fs'

if (process.argv.length < 3) {
    throw new Error('no number of images to generate')
}

const num = parseInt(process.argv[2])
const root = process.argv[3] ?? '.'

if (num === NaN) {
    throw new Error('number of image must be an integer')
}

process.chdir(root)

const paths = {
    mapping: `./mapping.json`,
    attributes: `./attributes.json`,
    traits: `./traits`,
}

if (!fs.existsSync(paths.mapping)) {
    throw new Error(`no ${paths.mapping} file found`)
}

const raw = fs.readFileSync(paths.mapping, 'utf8')

const mapping = JSON.parse(raw)

// format & validate the traits
type Trait = {
    type: string
    values: Array<{
        value: string
        p: number
        file: string
    }>
}

const traits: Trait[] = []

for (const dir in mapping) {
    let sump = 0

    const type = dir.replace('_', ' ')

    const values = []

    for (const file in mapping[dir]) {
        sump += mapping[dir][file]

        values.push({
            value: file.replace('_', ' ').replace('.png', ''),
            p: mapping[dir][file],
            file: `${paths.traits}/${dir}/${file}`,
        })
    }

    if (values.length === 0) {
        throw new Error(`trait ${type} has no value`)
    }

    if (sump != 100) {
        throw new Error(`trait ${type}: sum of probabilities must be 100 (${sump})`)
    }

    traits.push({ type, values })
}

// ensure there is more combinations than expected numbers.
const comb = traits.reduce((acc, { values }) => acc * values.length, 1);

if (num > comb / 2) {
    throw new Error(`not enough trait combinations (${comb}) to produce ${num} images (at least x2 needed)`)
}

// make num random images & compute stats
type Attribute = {
    type: string
    value: string
    p: number
    file: string
}

const seen: Record<string, boolean> = {}

const newIndexes = (): number[] => {
    const is = []

    for (const { values } of traits) {
        is.push(choice(values.map(({ p }) => p)))
    }

    return is
}

const uniqIndexes = (): number[] => {
    const is = newIndexes()

    const key = is.join(':')

    if (seen[key] === true) {
        return uniqIndexes()
    }

    seen[key] = true

    return is
}

const newAttributeList = (uniq: boolean = false): Attribute[] => {
    const is = uniq ? uniqIndexes() : newIndexes()

    const xs = []

    for (let i = 0; i < traits.length; i++) {
        const type = traits[i].type
        const value = traits[i].values[is[i]]

        xs.push({ type, ...value })
    }

    return xs
}

const attributes: Attribute[][] = []

for (let i = 0; i < num; i++) {
    attributes.push(newAttributeList(true))
}

// write the attribute file
fs.writeFileSync(paths.attributes, JSON.stringify(attributes, null, 2));

// random weighted
function choice(weights: number[]): number {
    if (weights.length === 0) {
        throw new Error('no weights given')
    }

    const sum = weights.reduce((acc, p) => acc + p, 0)

    const r = Math.random() * sum

    let total = 0

    for (let i = 0; i < weights.length - 1; i++) {
        total += weights[i]

        if (total > r) {
            return i
        }
    }

    return weights.length - 1
}
