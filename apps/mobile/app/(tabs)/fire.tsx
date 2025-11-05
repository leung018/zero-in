import { FirebaseAuthTypes, getAuth, onAuthStateChanged } from '@react-native-firebase/auth'
import { doc, getDoc, getFirestore, onSnapshot, setDoc } from '@react-native-firebase/firestore'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

export default function FirestoreExperimentScreen() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null)
  const [endAt, setEndAt] = useState<string>('Loading...')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (firebaseUser) => {
      setUser(firebaseUser)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (user) {
      getTimeDataFromFirestore(user.uid).then((endAt) => {
        setEndAt(endAt)
      })
      setSampleDataToFirestore(user.uid)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      const unsubscribe = onSnapshot(
        doc(getFirestore(), 'users', user.uid, 'application', 'timerState'),
        (doc) => {
          setEndAt(doc.data()?.endAt ?? 'No Data')
        }
      )
      return unsubscribe
    }
  }, [user])

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading User</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text>{new Date(endAt).toLocaleString()}</Text>
    </View>
  )
}

async function getTimeDataFromFirestore(userId: string): Promise<string> {
  const result = await getDoc(doc(getFirestore(), 'users', userId, 'application', 'timerState'))
  return result.data()!.endAt ?? 'No Data'
}

async function setSampleDataToFirestore(userId: string): Promise<void> {
  await setDoc(doc(getFirestore(), 'users', userId, 'testing', 'sampleData'), { hello: 'world' })
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  }
})
