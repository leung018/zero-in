import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React, { useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { SideMenu } from '../../components/ui/side-menu'

export default function TabLayout() {
  const [menuVisible, setMenuVisible] = useState(false)
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#8E8E93',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E5EA'
          },
          headerShown: false
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Timer',
            tabBarIcon: ({ color, size }) => <Ionicons name="timer" size={size} color={color} />
          }}
        />
        <Tabs.Screen
          name="blocking"
          options={{
            title: 'Blocking',
            tabBarIcon: ({ color, size }) => <Ionicons name="ban" size={size} color={color} />
          }}
        />
        <Tabs.Screen
          name="statistics"
          options={{
            title: 'Statistics',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart" size={size} color={color} />
            )
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            title: 'Menu',
            tabBarIcon: ({ color, size }) => <Ionicons name="menu" size={size} color={color} />,
            tabBarButton: (props) => {
              const { children, style, accessibilityLabel, testID } = props as any
              return (
                <TouchableOpacity
                  style={style}
                  onPress={() => setMenuVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel={accessibilityLabel ?? 'Open more menu'}
                  testID={testID}
                  activeOpacity={0.7}
                >
                  {children}
                </TouchableOpacity>
              )
            }
          }}
        />
      </Tabs>

      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  )
}
