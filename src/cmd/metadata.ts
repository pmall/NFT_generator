import fs from 'fs'
import path from 'path'
import { paths } from '../config'

type Attribute = {
    type: string
    value: string
}

export const metadata = async (name: string, dir: string) => {
    const root = dir.replace(/\/+$/, '')

    console.log(`Generating metadata from ${path.join(root, paths.attributes)} and ${path.join(root, paths.cids)}`)

    process.chdir(root)

    // read attributes file
    if (!fs.existsSync(paths.attributes)) {
        throw new Error(`no ${paths.attributes} file found`)
    }

    const raw1 = fs.readFileSync(paths.attributes, 'utf8')

    const attributes: Record<string, Attribute[]> = JSON.parse(raw1)

    // read cids file
    if (!fs.existsSync(paths.cids)) {
        throw new Error(`no ${paths.cids} file found`)
    }

    const raw2 = fs.readFileSync(paths.cids, 'utf8')

    const cids: Record<string, string> = JSON.parse(raw2)

    // remove all files of the metadata folder
    const files = fs.readdirSync(paths.metadata)

    for (const file of files) {
        if (file !== '.gitignore') {
            fs.unlinkSync(`${paths.metadata}/${file}`)
        }
    }

    // loop over attributes
    for (const i in attributes) {
        if (cids[i] === undefined) {
            throw new Error('attributes and cids ids not matching')
        }

        const xs = attributes[i]
        const cid = cids[i]

        const metadata = {
            name: `${name} ${i}`,
            image: `ipfs://${cid}`,
            attributes: xs.map(x => ({
                trait_type: x.type,
                value: x.value,
            }))
        }

        fs.writeFileSync(path.join(paths.metadata, i), JSON.stringify(metadata, null, 2));
    }

    console.log(`Metadata generated into ${path.join(root, paths.metadata)}`)
}
