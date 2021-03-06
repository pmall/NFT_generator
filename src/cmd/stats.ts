import fs from 'fs'
import path from 'path'
import { paths } from '../config'

type Attribute = {
    type: string
    value: string
    file: string
}

export const stats = async (dir: string) => {
    const root = dir.replace(/\/+$/, '')

    console.log(`Computing stats from ${path.join(root, paths.attributes)}`)

    process.chdir(root)

    if (!fs.existsSync(paths.attributes)) {
        throw new Error(`no ${paths.attributes} file found`)
    }

    const raw = fs.readFileSync(paths.attributes, 'utf8')

    const attributes: Record<string, Attribute[]> = JSON.parse(raw)

    const total: number = Object.values(attributes).length
    const stats: Record<string, Record<string, { total: number, percent: number }>> = {}

    for (const i in attributes) {
        const xs = attributes[i]

        for (const x of xs) {
            if (stats[x.type] === undefined) {
                stats[x.type] = {}
            }

            if (stats[x.type][x.value] === undefined) {
                stats[x.type][x.value] = { total: 0, percent: 0 }
            }

            stats[x.type][x.value].total++
            stats[x.type][x.value].percent += Math.floor((1 / total) * 10000) / 100
        }
    }

    fs.writeFileSync(paths.stats, JSON.stringify(stats, null, 2));

    console.log(`Stats computed into ${path.join(root, paths.stats)}`)
}
