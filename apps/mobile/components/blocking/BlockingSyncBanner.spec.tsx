import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { BlockingSyncBanner } from './BlockingSyncBanner'

describe('BlockingSyncBanner', () => {
  it('should render refined sync copy', () => {
    const wrapper = render(<BlockingSyncBanner triggerAppBlockToggling={async () => {}} />)

    expect(wrapper.getByText('Tap to sync your blocking state')).toBeTruthy()
    expect(wrapper.getByText('Use this if your blocked apps look out of sync.')).toBeTruthy()
  })

  it('should trigger a manual sync and show progress state', async () => {
    let resolveSync: (() => void) | undefined
    const triggerAppBlockToggling = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSync = resolve
        })
    )

    const wrapper = render(<BlockingSyncBanner triggerAppBlockToggling={triggerAppBlockToggling} />)

    fireEvent.press(wrapper.getByTestId('blocking-sync-banner'))

    expect(triggerAppBlockToggling).toHaveBeenCalledTimes(1)
    expect(wrapper.getByText('Syncing blocking state...')).toBeTruthy()
    expect(wrapper.getByTestId('blocking-sync-spinner')).toBeTruthy()

    resolveSync?.()

    await waitFor(() => {
      expect(wrapper.getByText('Blocking state is up to date')).toBeTruthy()
    })
  })
})
