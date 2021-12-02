import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

type Attribute = {
    file: string
}

const paths = {
    attributes: `./attributes.json`,
    images: `./images`,
}

export const images = async (dir: string) => {
    const root = dir.replace(/\/+$/, '')

    console.log(`Generating images from ${root}/attributes.json`)

    process.chdir(root)

    if (!fs.existsSync(paths.attributes)) {
        throw new Error(`no ${paths.attributes} file found`)
    }

    const raw = fs.readFileSync(paths.attributes, 'utf8')

    const attributes: Record<string, Attribute[]> = JSON.parse(raw)

    // remove all .png files of the images folder
    const files = fs.readdirSync(paths.images)

    for (const file of files) {
        if (path.extname(file) == '.png') {
            fs.unlinkSync(`${paths.images}/${file}`)
        }
    }

    // generate one image per attributes
    for (const i in attributes) {
        const xs = attributes[i]
        const x = xs.shift()

        if (!x) throw new Error(`No trait for image ${i}`)

        sharp(x.file)
            .composite(xs.map(({ file }) => ({ input: file })))
            .toFile(`${paths.images}/${i}.png`)
    }
}
