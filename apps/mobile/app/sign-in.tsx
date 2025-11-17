import React from 'react'
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import GoogleSignInButton from '../components/google-sign-in-button'

const SignInScreen = () => {
  const handleLinkPress = (url: string) => {
    Linking.openURL(url)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to Zero In</Text>
            <Text style={styles.subtitle}>Sign in to unlock your full potential</Text>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoTitleRow}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>⭐</Text>
              </View>
              <Text style={styles.infoTitle}>Limited Time Offer</Text>
            </View>
            <Text style={styles.infoText}>
              Sign in to unlock{' '}
              <Text
                style={styles.link}
                onPress={() => handleLinkPress('https://zeroin.dev/premium')}
              >
                premium features
              </Text>
              ! Enjoy a <Text style={styles.bold}>free trial</Text> during this promotion
              <Text style={styles.muted}> (may end at any time)</Text>.
            </Text>
          </View>

          {/* Google Sign-In Button */}
          <View style={styles.buttonContainer}>
            <GoogleSignInButton onPress={() => {}} />
          </View>

          {/* Terms and Privacy */}
          <View style={styles.footer}>
            <Text style={styles.termsText}>
              By signing in, you agree to our{' '}
              <Text
                style={styles.footerLink}
                onPress={() => handleLinkPress('https://zeroin.dev/tos')}
              >
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text
                style={styles.footerLink}
                onPress={() => handleLinkPress('https://zeroin.dev/privacy')}
              >
                Privacy Policy
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa'
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24
  },
  content: {
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center'
  },
  header: {
    marginBottom: 40,
    alignItems: 'center'
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 32
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  icon: {
    fontSize: 20
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1
  },
  infoText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#475569'
  },
  bold: {
    fontWeight: '600',
    color: '#1a1a1a'
  },
  muted: {
    fontSize: 14,
    color: '#94a3b8'
  },
  link: {
    color: '#1a73e8',
    fontWeight: '600',
    textDecorationLine: 'underline'
  },
  buttonContainer: {
    marginBottom: 24,
    alignItems: 'center'
  },
  footer: {
    paddingHorizontal: 8
  },
  termsText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#64748b',
    textAlign: 'center'
  },
  footerLink: {
    color: '#1a73e8',
    fontWeight: '500',
    textDecorationLine: 'underline'
  }
})

export default SignInScreen
