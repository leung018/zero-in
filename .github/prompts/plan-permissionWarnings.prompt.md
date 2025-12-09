# Plan: Add Permission-Specific Warnings and Sequential Requests

## Overview

Refactor the permission system to display separate warning banners for each required permission (iOS: FamilyControls; Android: Overlay + Usage Stats), and implement sequential permission requests on Android so users grant one permission at a time instead of both simultaneously. iOS will remain single-step since it has one unified permission.

## Implementation Steps

### 1. Extend `AppBlockerModule` Interface

Replace the simple `isGranted: boolean` response with structured permission data using a `PermissionStatus` class and rename the native getter to `getPermissionDetails`.

**Current:**

```typescript
declare class AppBlockerModule extends NativeModule {
  getPermissionStatus(): Promise<{ isGranted: boolean }>
  requestPermissions(): Promise<void>
  blockApps(): Promise<void>
  unblockApps(): Promise<void>
}
```

**Target:**

```typescript
declare class AppBlockerModule extends NativeModule {
  getPermissionDetails(): Promise<PermissionDetails>
  requestPermission(permissionType: string): Promise<void>
  blockApps(): Promise<void>
  unblockApps(): Promise<void>
}
```

**Changes:**

- Rename native getter to `getPermissionDetails()`
- Remove `requestPermissions()` (plural), add `requestPermission(permissionType)` (singular) for requesting individual permissions
- Native response now returns `PermissionDetails` directly (no wrapper object, no `isGranted` field)
- `isGranted` is computed by `PermissionStatus` class from `details`

**Permission Details Structure:**

- **iOS**: `{ familyControls: boolean }`
- **Android**: `{ overlay: boolean; usageStats: boolean }`

### 2. Update Native Implementations

#### iOS (`AppBlockerModule.swift`)

Modify `getPermissionDetails` to return only granular permission details (no `isGranted`):

```swift
AsyncFunction("getPermissionDetails") { promise in
  if #available(iOS 15.0, *) {
    let ac = AuthorizationCenter.shared
    let isGranted = ac.authorizationStatus == .approved
    promise.resolve([
      "familyControls": isGranted
    ])
  }
}
```

Add new method for single permission requests (replaces `requestPermissions`):

```swift
AsyncFunction("requestPermission") { (permissionType: String, promise: Promise) in
  if #available(iOS 16.0, *) {
    Task {
      try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
      promise.resolve(nil)
    }
  }
}
```

**Note:** The `permissionType` parameter is ignored on iOS since there's only one permission (Family Controls), but it's kept for API consistency with Android.

#### Android (`AppBlockerModule.kt`)

Modify `getPermissionDetails` to return only per-permission status (no `isGranted`):

```kotlin
AsyncFunction("getPermissionDetails") {
  val context = appContext.reactContext ?: return@AsyncFunction
  mapOf(
    "overlay" to hasOverlayPermission(context),
    "usageStats" to hasUsageStatsPermission(context)
  )
}
```

Add new method for sequential permission requests (replaces `requestPermissions`):

```kotlin
AsyncFunction("requestPermission") { (permissionType: String, promise: Promise) in
  val context = appContext.reactContext ?: return@AsyncFunction
  when (permissionType) {
    "overlay" -> requestOverlayPermission(context)
    "usageStats" -> requestUsageStatsPermission(context)
  }
  promise.resolve(null)
}
```

**Note:** This method requests ONE permission at a time, enabling sequential permission flow on Android.

### 3. Update TypeScript Module Wrapper

File: `apps/mobile/modules/app-blocker/src/AppBlockerModule.ts`

```typescript
import { NativeModule, requireNativeModule } from 'expo'

interface PermissionDetails {
  [key: string]: boolean
}

class PermissionStatus {
  constructor(public readonly details: PermissionDetails) {}

  get isGranted(): boolean {
    return Object.values(this.details).every((granted) => granted === true)
  }

  hasPermission(type: string): boolean {
    return this.details[type] === true
  }

  getMissingPermissions(): string[] {
    return Object.entries(this.details)
      .filter(([_, granted]) => !granted)
      .map(([type, _]) => type)
  }

  // Factory method to create from native response
  static fromNativeResponse(details: PermissionDetails): PermissionStatus {
    return new PermissionStatus(details)
  }
}

declare class AppBlockerModule extends NativeModule {
  getPermissionDetails(): Promise<PermissionDetails>
  requestPermission(permissionType: string): Promise<void>
  blockApps(): Promise<void>
  unblockApps(): Promise<void>
}

const nativeModule = requireNativeModule<AppBlockerModule>('AppBlocker')

// Thin wrapper to always return PermissionStatus and encapsulate native calls
export const appBlocker = {
  async getPermissionStatus(): Promise<PermissionStatus> {
    const response = await nativeModule.getPermissionDetails()
    return PermissionStatus.fromNativeResponse(response)
  },
  requestPermission(permissionType: string): Promise<void> {
    return nativeModule.requestPermission(permissionType)
  },
  blockApps(): Promise<void> {
    return nativeModule.blockApps()
  },
  unblockApps(): Promise<void> {
    return nativeModule.unblockApps()
  }
}

// Default export is the wrapper, not the raw native module
export default appBlocker
```

### 4. Refactor `blocking.tsx` State Management

#### New State Structure

Replace:

```typescript
const [isPermissionGranted, setIsPermissionGranted] = useState(true)
```

With:

```typescript
import appBlocker, { PermissionStatus } from '../../modules/app-blocker/src/AppBlockerModule'

const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>(new PermissionStatus({}))
```

**Note:** `PermissionStatus` class encapsulates all permission logic including `isGranted` (computed from `details`), `getMissingPermissions()`, and `hasPermission(type)`.

#### Helper Functions

Add utility functions for permission labels and descriptions:

```typescript
const getPermissionLabel = (permissionType: string): string => {
  const labels: Record<string, string> = {
    familyControls: 'Family Controls',
    overlay: 'Appear on Top',
    usageStats: 'Usage Access'
  }
  return labels[permissionType] || permissionType
}

const getPermissionDescription = (permissionType: string): string => {
  const descriptions: Record<string, string> = {
    familyControls: 'Allow Zero In to block apps during focus sessions using iOS Family Controls.',
    overlay: 'Allow Zero In to appear on top of other apps to show blocking screens.',
    usageStats: 'Allow Zero In to detect which apps are active for blocking.'
  }
  return descriptions[permissionType] || 'This permission is required for app blocking.'
}
```

**Note:** `getMissingPermissions()` and `isGranted` are now handled by the `PermissionStatus` class, eliminating the need for separate helper functions.

#### Update Permission Checking

Replace existing `useFocusEffect`:

```typescript
useFocusEffect(
  useCallback(() => {
    const checkPermission = async () => {
      try {
        const status = await appBlocker.getPermissionStatus()
        setPermissionStatus(status)
      } catch (error) {
        console.error('Failed to check permission:', error)
      }
    }
    checkPermission()
  }, [])
)
```

#### Update Permission Requests

Replace `handleFixPermission`:

```typescript
const handleRequestPermission = async (permissionType: string) => {
  try {
    await appBlocker.requestPermission(permissionType)

    // Re-check all permissions after request
    const status = await appBlocker.getPermissionStatus()
    setPermissionStatus(status)
  } catch (error) {
    console.error(`Failed to request ${permissionType} permission:`, error)
    Alert.alert('Error', `Failed to request ${getPermissionLabel(permissionType)} permission`)
  }
}
```

### 5. Create Individual Permission Warning Banners

#### New `PermissionBanner` Component (Optional: Extract to separate file)

```typescript
interface PermissionBannerProps {
  permissionType: string
  label: string
  description: string
  onPress: () => Promise<void>
}

const PermissionBanner: React.FC<PermissionBannerProps> = ({
  permissionType,
  label,
  description,
  onPress
}) => {
  return (
    <TouchableOpacity
      style={styles.permissionBanner}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.permissionIcon}>⚠️</Text>
      <View style={styles.permissionTextContainer}>
        <Text style={styles.permissionTitle}>{label} Required</Text>
        <Text style={styles.permissionDesc}>{description}</Text>
      </View>
      <Text style={styles.arrowIcon}>→</Text>
    </TouchableOpacity>
  )
}
```

#### Render All Missing Permission Banners

Replace existing permission banner rendering:

```typescript
{
  permissionStatus.getMissingPermissions().map((permissionType) => (
    <PermissionBanner
      key={permissionType}
      permissionType={permissionType}
      label={getPermissionLabel(permissionType)}
      description={getPermissionDescription(permissionType)}
      onPress={() => handleRequestPermission(permissionType)}
    />
  ))
}
```

**Note:** `permissionStatus.getMissingPermissions()` returns an array of permission types that are not granted (e.g., `['overlay', 'usageStats']` on Android), enabling automatic rendering of individual banners for each missing permission.

### 6. Sequential Request Flow Implementation

**Android Behavior** (Natural from single permission requests):

1. User sees both permission banners if both permissions are missing: "Appear on Top" and "Usage Access"
2. User taps banner for Overlay permission → `requestPermission('overlay')`
3. Android Settings opens for overlay permission
4. User grants or denies → App returns to foreground
5. `useFocusEffect` triggers and re-checks all permissions via `getPermissionStatus()`
6. UI updates: If Overlay granted, that banner disappears; Usage Stats banner remains
7. User taps Usage Stats banner → `requestPermission('usageStats')`
8. Settings opens for usage stats → Cycle repeats
9. When all permissions granted, all banners disappear

**iOS Behavior** (Simplified - single permission):

1. User sees single "Family Controls Required" banner if permission missing
2. User taps banner → `requestPermission('familyControls')`
3. iOS system dialog appears inline
4. User grants or denies → Dialog dismisses
5. App re-checks permissions via `getPermissionStatus()`
6. Banner disappears if granted, remains if denied

**Key Points:**

- **No forced sequence:** Android users can tap banners in any order
- **Automatic updates:** `useFocusEffect` hook automatically re-checks permissions when screen regains focus after Settings navigation
- **Per-permission feedback:** Each banner shows loading state (`⏳`) while its specific permission is being requested

### 7. Update Blocking Operations

Verify all permissions before starting blocking:

```typescript
const handleStartBlocking = async () => {
  if (!permissionStatus.isGranted) {
    Alert.alert(
      'Permissions Required',
      'Please grant all required permissions before starting blocking.'
    )
    return
  }

  try {
    await appBlocker.blockApps()
    // ... rest of blocking logic
  } catch (error) {
    console.error('Failed to start blocking:', error)
  }
}
```

## Key Changes Summary

| Component                | Change                                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `AppBlockerModule.ts`    | Add `PermissionStatus` class, expose `appBlocker` wrapper (default export) that returns `PermissionStatus` |
| `AppBlockerModule.swift` | Return only `details` object (no `isGranted`), add `requestPermission(type)`                               |
| `AppBlockerModule.kt`    | Return only `details` object (no `isGranted`), add `requestPermission(type)`                               |
| `blocking.tsx` State     | Replace `isPermissionGranted` with `PermissionStatus` instance, use `appBlocker`                           |
| `blocking.tsx` UI        | Replace single permission banner with loop rendering per-permission banners                                |
| `blocking.tsx` Logic     | Use `permissionStatus.getMissingPermissions()`, `permissionStatus.isGranted`, and wrapper calls            |

## Design Decisions

### iOS vs Android UX Parity

- **iOS**: Shows single "Family Controls Required" banner (one unified permission)
- **Android**: Shows separate "Appear on Top" and "Usage Access" banners for each permission

Rationale: Reflects platform-native permission models while providing granular control on Android.

### Sequential vs Simultaneous Requests

- **iOS**: Single permission request (no choice needed)
- **Android**: Sequential requests through individual `requestPermission()` calls—users grant one permission, then UI updates to show remaining missing permissions

Rationale: Improves UX on Android by avoiding simultaneous system dialogs and settings navigation.

### Error Handling

- Catches permission request errors and shows per-permission error alerts
- Re-checks all permission status after each request to ensure state accuracy
- Disables retry buttons during active requests via `isRequestingPermission` state

### Backward Compatibility

- Native modules now return only `details` object (simplified response)
- `isGranted` is computed via `PermissionStatus.isGranted` getter (derived from `details`)
- This is a **breaking change** to the native module interface, but improves maintainability by having single source of truth
- Any existing code checking permissions should be updated to use `PermissionStatus` class

## Further Refinements

1. **Loading States**: Add visual feedback (loading spinner or "Requesting..." text) while permission dialog is open
2. **Settings Navigation**: On Android, should tapping a permission banner attempt to navigate directly to the specific system settings page, or just open the intent? (Current design: just open intent)
3. **Permission Rationale Dialog** (Android): Before opening system settings, show a brief explainer dialog: "Display Over Other Apps is needed to show blocking notifications when apps are detected"
4. **Retry Logic**: Should failed permission requests have a retry mechanism, or just show the banner again?
5. **Onboarding Flow**: Should initial app launch show a permission request screen before the blocking screen, or request as users enable blocking?
