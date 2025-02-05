const getBlockedTemplateUrl = () => {
  return chrome.runtime.getURL('blocked.html')
}

export default {
  getBlockedTemplateUrl
}
