import fs from 'fs'
import path from 'path'
import { paths } from '../config'

type Trait = {
    type: string
    values: Array<{
        value: string
        p: number
        file: string
    }>
}

type Attribute = {
    type: string
    value: string
    p: number
    file: string
}

export const attributes = (n: number, dir: string, options: { unique: boolean }) => {
    const root = dir.replace(/\/+$/, '')

    const message1 = options.unique
        ? `Generating ${n} unique random lists of traits from ${path.join(dir, paths.mapping)}`
        : `Generating ${n} non unique random lists of traits from ${path.join(dir, paths.mapping)}`

    console.log(message1)

    process.chdir(root)

    if (!fs.existsSync(paths.mapping)) {
        throw new Error(`no ${paths.mapping} file found`)
    }

    const raw = fs.readFileSync(paths.mapping, 'utf8')

    const mapping = JSON.parse(raw)

    // format & validate the traits
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

    if (options.unique && n > comb / 2) {
        throw new Error(`not enough trait combinations (${comb}) to produce ${n} images (at least x2 needed)`)
    }

    // make num random images & compute stats
    const attributes: Record<string, Attribute[]> = {}

    for (let i = 0; i < n; i++) {
        attributes[i + 1] = newAttributeList(traits, options.unique)
    }

    // write the attribute file
    fs.writeFileSync(paths.attributes, JSON.stringify(attributes, null, 2));

    const message2 = options.unique
        ? `${n} unique random lists of traits generated in ${path.join(dir, paths.attributes)}`
        : `${n} non unique random lists of traits generated in ${path.join(dir, paths.attributes)}`

    console.log(message2)
}

// functions for generating lists
const seen: Record<string, boolean> = {}

const newIndexes = (traits: Trait[]): number[] => {
    const is = []

    for (const { values } of traits) {
        is.push(choice(values.map(({ p }) => p)))
    }

    return is
}

const uniqIndexes = (traits: Trait[]): number[] => {
    const is = newIndexes(traits)

    const key = is.join(':')

    if (seen[key] === true) {
        return uniqIndexes(traits)
    }

    seen[key] = true

    return is
}

const newAttributeList = (traits: Trait[], uniq: boolean = false): Attribute[] => {
    const is = uniq ? uniqIndexes(traits) : newIndexes(traits)

    const xs = []

    for (let i = 0; i < traits.length; i++) {
        const type = traits[i].type
        const value = traits[i].values[is[i]]

        xs.push({ type, ...value })
    }

    return xs
}

const choice = (weights: number[]): number => {
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
