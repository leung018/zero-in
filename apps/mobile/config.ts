export function getGoogleServicesPlistPath() {
  return process.env.GOOGLE_SERVICES_PLIST || './GoogleService-Info.plist'
}

export function getGoogleServicesJsonPath() {
  return process.env.GOOGLE_SERVICES_JSON || './google-services.json'
}
