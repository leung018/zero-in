import { collection, deleteDoc, getDocs } from 'firebase/firestore'
import { db, FirebaseServices } from '../firebase/services'

export async function notifyMobileSync(): Promise<void> {
  const uid = await FirebaseServices.getCurrentUserId()
  if (!uid) return

  const snap = await getDocs(collection(db, 'users', uid, 'pushTokens'))
  const tokens = snap.docs.map((d) => d.data().token as string).filter(Boolean)
  if (!tokens.length) return

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      tokens.map((to) => ({
        to,
        _contentAvailable: true,
        data: { kind: 'app-block-sync' }
      }))
    )
  })

  if (!response.ok) return

  const result = await response.json()
  const tickets: any[] = Array.isArray(result.data) ? result.data : [result.data]

  tickets.forEach((ticket, i) => {
    if (ticket?.details?.error === 'DeviceNotRegistered') {
      const tokenDoc = snap.docs[i]
      if (tokenDoc) deleteDoc(tokenDoc.ref).catch(() => {})
    }
  })
}
