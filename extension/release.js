import { execSync } from 'child_process'
import process from 'process'

if (process.argv.length < 3) {
  console.error('Usage: node release.js <tag>')
  process.exit(1)
}

const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim()
if (currentBranch !== 'main') {
  console.error(`Error: Releases can only be created from the 'main' branch.`)
  console.error(`Current branch is '${currentBranch}'.`)
  process.exit(1)
}

const inputTag = process.argv[2]
const tag = `extension-${inputTag}`
const message = `version ${tag}`

try {
  console.log(`Creating tag: ${tag}`)
  execSync(`git tag -a ${tag} -m "${message}"`, { stdio: 'inherit' })

  console.log(`Pushing tag: ${tag}`)
  execSync(`git push origin ${tag}`, { stdio: 'inherit' })

  console.log(
    `Tag pushed successfully!\nPlease download the release and upload it to the Chrome Web Store.`
  )
} catch (error) {
  console.error('Error occurred:', error.message)
  process.exit(1)
}
