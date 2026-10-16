import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword
} from '@react-native-firebase/auth'
import { Link } from 'expo-router'
import { useRef, useState } from 'react'
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import GoogleSignInButton from '../components/google-sign-in-button'
import GoogleSignInModule from '../modules/google-sign-in'

const reportSignInError = (step: string, error: unknown) => {
  console.error(`[sign-in] ${step} failed:`, error)
  Alert.alert(
    'Sign-In Error',
    __DEV__ ? `${step} failed: ${error}` : 'An error occurred during sign-in. Please try again.'
  )
}

const handleGoogleSignIn = async () => {
  let idToken: string
  try {
    idToken = await GoogleSignInModule.signIn()
  } catch (error: any) {
    if (error?.code === 'USER_CANCELLED') return
    reportSignInError('GoogleSignInModule.signIn', error)
    return
  }

  try {
    await signInWithCredential(getAuth(), GoogleAuthProvider.credential(idToken))
  } catch (error) {
    reportSignInError(`signInWithCredential (idToken length ${idToken?.length ?? 'null'})`, error)
  }
}

// Hidden email sign-in so Apple reviewers can use a demo account (Google sign-in isn't usable for them).
// Reveal by tapping the title SECRET_TAP_COUNT times within SECRET_TAP_WINDOW_MS.
const SECRET_TAP_COUNT = 5
const SECRET_TAP_WINDOW_MS = 3000

const handleEmailSignIn = async (email: string, password: string) => {
  try {
    await signInWithEmailAndPassword(getAuth(), email.trim(), password)
  } catch (error) {
    reportSignInError('signInWithEmailAndPassword', error)
  }
}

const EmailSignInForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const passwordRef = useRef<TextInput>(null)
  const submit = () => handleEmailSignIn(email, password)

  return (
    <View style={styles.emailForm}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        ref={passwordRef}
        style={styles.input}
        placeholder="Password"
        autoCapitalize="none"
        secureTextEntry
        returnKeyType="go"
        onSubmitEditing={submit}
        value={password}
        onChangeText={setPassword}
      />
      <Pressable style={styles.emailButton} onPress={submit}>
        <Text style={styles.emailButtonText}>Sign in with email</Text>
      </Pressable>
    </View>
  )
}

const SignInScreen = () => {
  const [showEmailForm, setShowEmailForm] = useState(false)
  const tapTimes = useRef<number[]>([])
  const scrollRef = useRef<ScrollView>(null)

  const handleTitlePress = () => {
    const now = Date.now()
    tapTimes.current = [...tapTimes.current.filter((t) => now - t < SECRET_TAP_WINDOW_MS), now]
    if (tapTimes.current.length >= SECRET_TAP_COUNT) {
      tapTimes.current = []
      setShowEmailForm(true)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.keyboardAvoider} behavior="padding">
        <ScrollView
          ref={scrollRef}
          // Keyboard shrinks the ScrollView via KeyboardAvoidingView; keep the email sign-in button visible above it
          onLayout={() => {
            if (showEmailForm && Keyboard.isVisible()) scrollRef.current?.scrollToEnd()
          }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Pressable onPress={handleTitlePress}>
                <Text style={styles.title}>Welcome to Zero In</Text>
              </Pressable>
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
                <Link href="https://zeroin.dev/premium" style={styles.link}>
                  premium features
                </Link>
                ! Enjoy a <Text style={styles.bold}>free trial</Text> during this promotion
                <Text style={styles.muted}> (may end at any time)</Text>.
              </Text>
            </View>

            {/* Google Sign-In Button */}
            <View style={styles.buttonContainer}>
              <GoogleSignInButton onPress={handleGoogleSignIn} />
            </View>

            {showEmailForm && <EmailSignInForm />}

            {/* Terms and Privacy */}
            <View style={styles.footer}>
              <Text style={styles.termsText}>
                By signing in, you agree to our{' '}
                <Link href="https://zeroin.dev/tos" style={styles.footerLink}>
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="https://zeroin.dev/privacy" style={styles.footerLink}>
                  Privacy Policy
                </Link>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa'
  },
  keyboardAvoider: {
    flex: 1
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
  emailForm: {
    marginBottom: 24,
    gap: 12
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a1a'
  },
  emailButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  emailButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
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
