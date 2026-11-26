import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'

type PasswordPromptModalProps = {
  onSubmit: (password: string) => void
  onCancel: () => void
}

export function PasswordPromptModal({ onSubmit, onCancel }: PasswordPromptModalProps) {
  const [password, setPassword] = useState('')
  const canSubmit = password.length > 0
  const submit = () => {
    if (canSubmit) onSubmit(password)
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView style={styles.overlay} behavior="padding">
        <View style={styles.dialog}>
          <Text style={styles.title}>Confirm Password</Text>
          <Text style={styles.message}>Enter your password to continue.</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            autoCapitalize="none"
            autoFocus
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={submit}
            value={password}
            onChangeText={setPassword}
          />
          <View style={styles.buttons}>
            <Pressable onPress={onCancel} hitSlop={8}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={submit} disabled={!canSubmit} hitSlop={8}>
              <Text style={[styles.confirmText, !canSubmit && styles.disabledText]}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.4)'
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 12
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1f1f'
  },
  message: {
    fontSize: 14,
    color: '#5f6368'
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
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 24,
    marginTop: 4
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5f6368'
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a73e8'
  },
  disabledText: {
    opacity: 0.4
  }
})
