export class UpdateSuccessNotifierService {
  // Require manual testing

  trigger() {
    // Create a popup element
    const popup = document.createElement('div')
    popup.style.position = 'fixed'
    popup.style.bottom = '20px'
    popup.style.left = '20px'
    popup.style.backgroundColor = '#4CAF50'
    popup.style.color = 'white'
    popup.style.padding = '15px'
    popup.style.borderRadius = '5px'
    popup.style.zIndex = '10000'
    popup.style.transition = 'opacity 1s'

    // Add content to the popup
    popup.innerHTML = `
      <div style="display: flex; align-items: center;">
        <span style="margin-right: 10px;">✓</span>
        <span>Update Successful!</span>
      </div>
    `

    // Add to body
    document.body.appendChild(popup)

    // Remove after a moment
    setTimeout(() => {
      popup.style.opacity = '0'
      setTimeout(() => {
        document.body.removeChild(popup)
      }, 500)
    }, 1000)
  }
}
