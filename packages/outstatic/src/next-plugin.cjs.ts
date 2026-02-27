import { withOutstatic } from './next-plugin'

// Keep CommonJS consumers ergonomic while avoiding mixed-export CJS warnings.
module.exports = withOutstatic
module.exports.withOutstatic = withOutstatic
