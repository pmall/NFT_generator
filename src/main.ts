#!/usr/bin/env node
import fs from 'fs'

const num = 9
const root = 'assets'

const files = {
    mapping: `./${root}/mapping.json`,
    attributes: `./${root}/images/attributes.csv`
}

if (!fs.existsSync(files.mapping)) {
    throw new Error(`no ${files.mapping} file found in current working directory`)
}

const raw = fs.readFileSync(files.mapping, 'utf8')

const mapping = JSON.parse(raw)

// format the mapping into traits
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
    const type = dir.replace('_', ' ')

    const values = []

    for (const file in mapping[dir]) {
        values.push({
            value: file.replace('_', ' ').replace('.png', ''),
            p: mapping[dir][file],
            file: ['.', root, 'attributes', dir, file].join('/'),
        })
    }

    traits.push({ type, values })
}

// ensure traits are valid
for (const { type, values } of traits) {
    if (values.length === 0) {
        throw new Error(`trait ${type} has no value`)
    }

    for (const { file } of values) {
        if (!fs.existsSync(file)) {
            throw new Error(`trait ${type}: file does not exist (${file})`)
        }
    }

    const sump = values.reduce((acc, { p }) => acc + p, 0)

    if (sump != 100) {
        throw new Error(`trait ${type}: sum of probabilities must be 100 (${sump})`)
    }
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

const stats: Record<string, Record<string, number>> = {}

for (const { type, values } of traits) {
    stats[type] = {}
    for (const { value } of values) {
        stats[type][value] = 0
    }
}

const seen: Record<string, boolean> = {}

const uniq = (): Attribute[] => {
    const rs = []

    for (const { values } of traits) {
        rs.push(choice(values.map(({ p }) => p)))
    }

    const key = rs.join(':')

    if (seen[key] === true) {
        return uniq()
    }

    seen[key] = true

    const xs = []

    for (let i = 0; i < traits.length; i++) {
        const type = traits[i].type
        const value = traits[i].values[rs[i]]

        xs.push({ type, ...value })
    }

    return xs
}

const attributes: Attribute[][] = []

for (let i = 0; i < num; i++) {
    const xs = uniq()

    for (const x of xs) stats[x.type][x.value]++

    attributes.push(xs)
}

console.log(stats)

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
