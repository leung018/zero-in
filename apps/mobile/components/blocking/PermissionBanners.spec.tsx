import { FakeAppBlockerPermissions, PermissionType } from '@/modules/app-blocker/src/permission'
import { act, fireEvent, render, RenderAPI, waitFor } from '@testing-library/react-native'
import { FakeForegroundNotifier } from '../../infra/foreground-notifier'
import { PermissionBanners } from './PermissionBanners'

describe('PermissionBanners', () => {
  it('should trigger app block toggling when permission is granted within the app', async () => {
    const { wrapper, triggerAppBlockToggling } = await renderPermissionBanners({
      permissionDetails: { [PermissionType.FamilyControls]: false },
      grantOnRequest: true
    })

    fireEvent.press(wrapper.getByTestId(`permission-banner-${PermissionType.FamilyControls}`))

    await waitFor(() => {
      expect(triggerAppBlockToggling).toHaveBeenCalledTimes(1)
    })
  })

  it('should trigger app block toggling when permission is granted outside the app', async () => {
    const { appBlockerPermissions, foregroundApp, triggerAppBlockToggling } =
      await renderPermissionBanners({
        permissionDetails: { [PermissionType.Overlay]: false }
      })

    appBlockerPermissions.grant(PermissionType.Overlay)
    await foregroundApp()

    await waitFor(() => {
      expect(triggerAppBlockToggling).toHaveBeenCalledTimes(1)
    })
  })

  it('should not trigger app block toggling when permission status is unchanged', async () => {
    const { foregroundApp, triggerAppBlockToggling } = await renderPermissionBanners({
      permissionDetails: {
        [PermissionType.Overlay]: true,
        [PermissionType.UsageStats]: false
      }
    })

    await foregroundApp()

    expect(triggerAppBlockToggling).not.toHaveBeenCalled()
  })
})

async function renderPermissionBanners({
  permissionDetails = { [PermissionType.FamilyControls]: false },
  grantOnRequest = true
}: {
  permissionDetails?: Record<string, boolean>
  grantOnRequest?: boolean
} = {}) {
  const appBlockerPermissions = new FakeAppBlockerPermissions({
    details: permissionDetails,
    grantOnRequest
  })
  const foregroundNotifier = new FakeForegroundNotifier()
  const triggerAppBlockToggling = jest.fn(async () => {})

  const wrapper: RenderAPI = render(
    <PermissionBanners
      appBlockerPermissions={appBlockerPermissions}
      foregroundNotifier={foregroundNotifier}
      triggerAppBlockToggling={triggerAppBlockToggling}
    />
  )

  await waitFor(() => {
    expect(wrapper.queryByTestId('permission-banners')).toBeTruthy()
  })

  const foregroundApp = async () => {
    await act(async () => {
      foregroundNotifier.simulateForeground()
    })
  }

  return { wrapper, appBlockerPermissions, foregroundApp, triggerAppBlockToggling }
}
