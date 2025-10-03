import { useState } from 'react'
import SoundTest from '../components/tests/SoundTest'

export default function SoundTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Sound Notification Test</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test the custom sound notifications for mentions and other alerts
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <SoundTest />
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">How It Works</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                Our custom sound notification system uses the Web Audio API to generate a pleasant "ding" sound 
                when you receive mentions or other important notifications.
              </p>
              <p>
                The sound is created with two oscillators playing in harmony:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>880Hz sine wave (A5 note)</li>
                <li>1320Hz sine wave (E6 note, a perfect fifth above)</li>
              </ul>
              <p>
                This creates a distinctive and pleasant sound that's different from typical messaging apps.
              </p>
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Settings</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  You can enable or disable sound notifications in the Settings page under the Notifications tab.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}