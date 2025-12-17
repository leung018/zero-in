import { StyleSheet } from 'react-native'

/**
 * Shared styles for common UI components used across the app.
 * These styles follow the design system used in blocking-related screens.
 */
export const commonStyles = StyleSheet.create({
  // Card container styles
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5
  },
  sectionHeader: {
    marginBottom: 20
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12
  },
  divider: {
    height: 3,
    backgroundColor: '#1a73e8',
    borderRadius: 2,
    width: 40
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#1a73e8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#1e40af'
  },
  secondaryButton: {
    backgroundColor: '#e1f5fe',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a73e8',
    marginTop: 16
  },
  secondaryButtonText: {
    color: '#1a73e8',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5
  }
})
