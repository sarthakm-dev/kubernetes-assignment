const path = require('path');
const validScopes = ['cli', 'docs', 'api','queue','cache','db','core'];
const scopeMultiPlugin = require(path.resolve(__dirname, 'commitlint-plugin-scope-multi.cjs'));

module.exports = {
  extends: ['@commitlint/config-conventional'],
  plugins: [scopeMultiPlugin],
  rules: {
    'scope-enum': [0], 
    'scope-empty': [2, 'never'],
    'scope-case': [2, 'always', 'lower-case'],
    'scope-multi-enum': [2, 'always', validScopes],
  },
  ignores: [message => message.includes('[skip-commitlint]')],
};