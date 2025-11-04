import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import GoogleSignInButton from '../../components/google-sign-in-button'
import GoogleSignInModule from '../../modules/google-sign-in/src/GoogleSignInModule'

GoogleSignInModule.configure({
  webClientId: '54527256719-mcqf4pfmc1blo0eroiolda0irv02ouue.apps.googleusercontent.com'
})

export default function TabTwoScreen() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null)
  const [loading, setLoading] = useState(true)

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signInWithFirebase = async (idToken: string) => {
    try {
      // Create Firebase credential from Google token
      const credential = auth.GoogleAuthProvider.credential(idToken)

      // Sign in to Firebase
      const userCredential = await auth().signInWithCredential(credential)

      Alert.alert('Success', 'Signed in successfully!')
    } catch (error) {
      Alert.alert('Error', String(error))
      console.error(error)
    }
  }

  const handleSignIn = async () => {
    setLoading(true)
    GoogleSignInModule.signIn()
      .then((idToken) => {
        signInWithFirebase(idToken)
      })
      .catch((error) => {
        Alert.alert('Error', String(error))
        console.error(error)
        setLoading(false)
      })
  }

  const handleSignOut = async () => {
    try {
      await auth().signOut()
      Alert.alert('Signed Out', 'You have been signed out successfully')
    } catch (error) {
      Alert.alert('Error', String(error))
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    )
  }

  if (user) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.displayName?.charAt(0) || 'U'}</Text>
          </View>

          <Text style={styles.name}>{user.displayName}</Text>
          <Text style={styles.email}>{user.email}</Text>

          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome</Text>

        <GoogleSignInButton onPress={handleSignIn} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: '100%'
  },
  googleLogo: {
    width: 20,
    height: 20,
    borderRadius: 2,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 24
  },
  logoText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3c4043'
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white'
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24
  },
  signOutBtn: {
    backgroundColor: '#ea4335',
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 24
  },
  signOutText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500'
  }
})
