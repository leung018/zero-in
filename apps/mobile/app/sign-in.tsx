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
            <Text style={styles.subtitle}>Sign in to get started</Text>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>✨</Text>
            </View>
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Sign in</Text> to unlock{' '}
              <Text
                style={styles.link}
                onPress={() => handleLinkPress('https://zeroin.dev/premium')}
              >
                premium features
              </Text>
              ! Enjoy a <Text style={styles.bold}>free trial</Text> during this{' '}
              <Text style={styles.bold}>limited-time promotion</Text>, though it may end at any
              time.
            </Text>
          </View>

          {/* Google Sign-In Button */}
          <View style={styles.buttonContainer}>
            <GoogleSignInButton onPress={() => {}} />
          </View>

          {/* Terms and Privacy */}
          <View style={styles.footer}>
            <Text style={styles.termsText}>
              By signing in, you agree to the{' '}
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
              .
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
    backgroundColor: '#f8f9fa'
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40
  },
  content: {
    paddingHorizontal: 24,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center'
  },
  header: {
    marginBottom: 32,
    alignItems: 'center'
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f1f1f',
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#5f6368',
    textAlign: 'center'
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8eaed'
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e6f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  icon: {
    fontSize: 24
  },
  infoText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#364f6b'
  },
  bold: {
    fontWeight: '600',
    color: '#1f1f1f'
  },
  link: {
    color: '#1a73e8',
    fontWeight: '600',
    textDecorationLine: 'underline'
  },
  buttonContainer: {
    marginTop: 32,
    marginBottom: 24,
    width: '100%'
  },
  footer: {
    marginTop: 24,
    paddingHorizontal: 8
  },
  termsText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#5f6368',
    textAlign: 'center'
  },
  footerLink: {
    color: '#1a73e8',
    textDecorationLine: 'underline'
  }
})

export default SignInScreen
