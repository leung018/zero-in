/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'device-activity-monitor',
  entitlements: {
    'com.apple.developer.family-controls': true,
    'com.apple.security.application-groups': ['group.dev.zeroin.mobile']
  },
  frameworks: ['DeviceActivity', 'FamilyControls', 'ManagedSettings']
})
