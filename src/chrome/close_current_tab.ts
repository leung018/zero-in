import type { ActionService } from '../infra/action'

export class CloseCurrentTabService implements ActionService {
  trigger() {
    chrome.tabs.getCurrent((tab) => {
      if (tab?.id) chrome.tabs.remove(tab.id)
    })
  }
}
