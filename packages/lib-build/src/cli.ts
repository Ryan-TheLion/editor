import { program } from 'commander'

import buildPkgJSONCommand from './commands/build-pkg-json'
import cleanCommand from './commands/clean'
import copyCommand from './commands/copy'

program.action(() => {
  program.help()
})

program.addCommand(cleanCommand)
program.addCommand(copyCommand)
program.addCommand(buildPkgJSONCommand)

program.parse()
