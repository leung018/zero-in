/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'device-activity-monitor',
  entitlements: { 'com.apple.developer.family-controls': true }
})
