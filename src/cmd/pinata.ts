import fs from 'fs'
import path from 'path'
import pinataSDK from '@pinata/sdk'
import { paths } from '../config'

export const pinata = async (dir: string) => {
    const root = dir.replace(/\/+$/, '')

    console.log(`Uploading images from ${path.join(root, paths.images)} to pinata`)

    process.chdir(root)

    // get attributes file
    if (!fs.existsSync(paths.attributes)) {
        throw new Error(`no ${paths.attributes} file found`)
    }

    const raw = fs.readFileSync(paths.attributes, 'utf8')

    const attributes: Record<string, any> = JSON.parse(raw)

    // init pinata sdk
    const pinata = pinataSDK(process.env.pinataApiKey || '', process.env.pinataSecretApiKey || '');

    try {
        await pinata.testAuthentication()

        // loop over ids upload and keep cid
        const cids: Record<string, string> = {}

        for (const i in attributes) {
            const file = path.join(paths.images, i + '.png')

            if (!fs.existsSync(file)) {
                throw new Error(`no ${file} file found`)
            }

            console.log('')
            console.log(`Uploading ${file}`)

            const stream = fs.createReadStream(file);

            const result = await pinata.pinFileToIPFS(stream)

            cids[i] = result.IpfsHash

            console.log(`${path.join(root, file)} uploaded to ${result.IpfsHash}`)
        }

        // wrinting cid file
        fs.writeFileSync(paths.cids, JSON.stringify(cids, null, 2));

        console.log('')
        console.log(`${Object.values(attributes).length} images uploaded to pinata`)
        console.log(`Cids saved in ${path.join(root, paths.cids)}`)
    }

    catch (err) {
        console.log(err)
    }
}
