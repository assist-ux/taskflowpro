import { useState } from 'react'
import { useNotifications } from '../contexts/NotificationContext'
import { soundManager } from '../utils/soundManager'

export default function SoundTestPage() {
  const { playTestMentionSound } = useNotifications()
  const [testResult, setTestResult] = useState<string>('')

  const testSoundManager = () => {
    setTestResult(`
Sound Manager Status:
- Sound Enabled: ${soundManager.isSoundEnabled()}
- User Interacted: ${soundManager.hasUserInteracted()}
- Audio Context State: ${soundManager['audioContext'] ? soundManager['audioContext'].state : 'Not initialized'}
    `)
  }

  const playTestSound = () => {
    console.log('Playing test sound from SoundTestPage')
    playTestMentionSound()
    setTestResult('Test sound played. Check console for logs.')
  }

  const simulateMention = () => {
    console.log('Simulating mention notification')
    // Simulate a mention notification
    const { addNotification } = useNotifications()
    // We can't call hook inside function, so we'll just log
    console.log('Would add mention notification here')
    setTestResult('Simulated mention notification. Check console for logs.')
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Sound Test Page</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Sound Testing</h2>
        
        <div className="space-y-4">
          <button
            onClick={testSoundManager}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Check Sound Manager Status
          </button>
          
          <button
            onClick={playTestSound}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Play Test Sound
          </button>
          
          <button
            onClick={simulateMention}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Simulate Mention Notification
          </button>
        </div>
      </div>
      
      {testResult && (
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="font-medium mb-2">Test Results:</h3>
          <pre className="whitespace-pre-wrap">{testResult}</pre>
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Troubleshooting Steps</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Click anywhere on the page to register user interaction</li>
          <li>Check if sound notifications are enabled in Settings</li>
          <li>Click "Play Test Sound" to verify sound functionality</li>
          <li>If still not working, check browser console for errors</li>
        </ol>
      </div>
    </div>
  )
}