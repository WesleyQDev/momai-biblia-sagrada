import fs from 'fs'

const content = fs.readFileSync('scripts/naa_usx/b5b81f73-6e09-4e32-a62f-9e7508241e8a/release/USX_1/MAT.usx', 'utf-8')
const tags = new Set()
const reg = /style="([^"]+)"/g
let m
while ((m = reg.exec(content)) !== null) {
  tags.add(m[1])
}

console.log('Styles in MAT.usx:', Array.from(tags))
