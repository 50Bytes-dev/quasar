const glob = require('fast-glob')
const path = require('path')
const fs = require('fs')

const { logError, writeFileIfChanged, convertToCjs } = require('./build.utils')

const
  root = path.resolve(__dirname, '..'),
  resolve = file => path.resolve(root, file)

const cjsBanner = setName => `/**
 * DO NOT EDIT THIS FILE. It is automatically generated
 * from its .mjs counterpart (same filename but with .mjs extension).
 * Edit that file instead (${ setName }).
 */
`

function parse (prop, txt) {
  const
    propIndex = txt.indexOf(prop),
    startIndex = txt.indexOf('\'', propIndex) + 1

  let stopIndex = txt.indexOf('\'', startIndex)

  while (txt.charAt(stopIndex - 1) === '\\') {
    stopIndex = txt.indexOf('\'', stopIndex + 1)
  }

  return txt.substring(startIndex, stopIndex).replace('\\', '')
}

module.exports.generate = function () {
  const languages = []
  const promises = []
  try {
    glob.sync('lang/*.mjs', { cwd: root, absolute: true })
      .forEach(file => {
        const content = fs.readFileSync(file, 'utf-8')
        const isoName = parse('isoName', content)
        const nativeName = parse('nativeName', content)
        languages.push({ isoName, nativeName })

        const cjsFile = file.replace('.mjs', '.js')
        const banner = cjsBanner(path.basename(file))
        promises.push(
          writeFileIfChanged(cjsFile, convertToCjs(content, banner))
        )
      })

    const
      langFile = resolve('lang/index.json'),
      quasarLangIndex = JSON.stringify(languages)

    promises.push(
      writeFileIfChanged(langFile, quasarLangIndex)
    )

    return Promise.all(promises).then(() => languages)
  }
  catch (err) {
    logError('build.lang.js: something went wrong...')
    console.log()
    console.error(err)
    console.log()
    process.exit(1)
  }
}
