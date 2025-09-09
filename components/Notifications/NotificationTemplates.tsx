'use client'

import { useState } from 'react'
import { MessageSquare, Save, RotateCcw } from 'lucide-react'

interface NotificationTemplate {
  id: string
  type: string
  scenario: string
  defaultTemplate: string
  currentTemplate: string
  variables: string[]
}

export default function NotificationTemplates() {
  // Default notification templates
  const defaultTemplates: NotificationTemplate[] = [
    {
      id: 'task_created_all',
      type: 'Task Created',
      scenario: 'Task created for everyone',
      defaultTemplate: '{actor} created a new task: "{taskTitle}"',
      currentTemplate: '{actor} created a new task: "{taskTitle}"',
      variables: ['{actor}', '{taskTitle}']
    },
    {
      id: 'task_created_self',
      type: 'Task Created',
      scenario: 'Task created for self',
      defaultTemplate: '{actor} created a new task for themselves: "{taskTitle}"',
      currentTemplate: '{actor} created a new task for themselves: "{taskTitle}"',
      variables: ['{actor}', '{taskTitle}']
    },
    {
      id: 'task_created_other',
      type: 'Task Created',
      scenario: 'Task created for specific person',
      defaultTemplate: '{actor} created a new task and assigned it to you: "{taskTitle}"',
      currentTemplate: '{actor} created a new task and assigned it to you: "{taskTitle}"',
      variables: ['{actor}', '{taskTitle}']
    },
    {
      id: 'task_assigned_all',
      type: 'Task Assigned',
      scenario: 'Task assigned to everyone',
      defaultTemplate: '{actor} assigned "{taskTitle}" to everyone',
      currentTemplate: '{actor} assigned "{taskTitle}" to everyone',
      variables: ['{actor}', '{taskTitle}']
    },
    {
      id: 'task_assigned_self',
      type: 'Task Assigned',
      scenario: 'Task assigned to self',
      defaultTemplate: '{actor} assigned "{taskTitle}" to themselves',
      currentTemplate: '{actor} assigned "{taskTitle}" to themselves',
      variables: ['{actor}', '{taskTitle}']
    },
    {
      id: 'task_assigned_other',
      type: 'Task Assigned',
      scenario: 'Task assigned to specific person',
      defaultTemplate: '{actor} assigned "{taskTitle}" to you',
      currentTemplate: '{actor} assigned "{taskTitle}" to you',
      variables: ['{actor}', '{taskTitle}']
    },
    {
      id: 'status_changed',
      type: 'Status Changed',
      scenario: 'Task status changed',
      defaultTemplate: '{actor} marked "{taskTitle}" as {status}',
      currentTemplate: '{actor} marked "{taskTitle}" as {status}',
      variables: ['{actor}', '{taskTitle}', '{status}']
    },
    {
      id: 'task_due',
      type: 'Daily Reminder',
      scenario: 'Tasks due today (single)',
      defaultTemplate: 'You have 1 task due today:\n{taskList}',
      currentTemplate: 'You have 1 task due today:\n{taskList}',
      variables: ['{taskList}']
    },
    {
      id: 'tasks_due',
      type: 'Daily Reminder',
      scenario: 'Tasks due today (multiple)',
      defaultTemplate: 'You have {count} tasks due today:\n{taskList}',
      currentTemplate: 'You have {count} tasks due today:\n{taskList}',
      variables: ['{count}', '{taskList}']
    }
  ]

  const [templates, setTemplates] = useState<NotificationTemplate[]>(defaultTemplates)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Group templates by type
  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.type]) {
      acc[template.type] = []
    }
    acc[template.type].push(template)
    return acc
  }, {} as Record<string, NotificationTemplate[]>)

  const handleTemplateChange = (id: string, value: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === id ? { ...t, currentTemplate: value } : t
    ))
  }

  const handleReset = (id: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === id ? { ...t, currentTemplate: t.defaultTemplate } : t
    ))
    setMessage({ type: 'success', text: 'Template reset to default' })
  }

  const handleResetAll = () => {
    setTemplates(prev => prev.map(t => ({ ...t, currentTemplate: t.defaultTemplate })))
    setMessage({ type: 'success', text: 'All templates reset to defaults' })
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    
    try {
      // In a real implementation, this would save to the database
      // For now, we'll store in localStorage as a demo
      localStorage.setItem('notificationTemplates', JSON.stringify(templates))
      setMessage({ type: 'success', text: 'Templates saved successfully!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save templates' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-squarage-white/50 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-brown-light/20 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-brown-dark">Notification Templates</h3>
          <p className="text-sm text-brown-medium mt-1">
            Customize how notification messages appear to users
          </p>
        </div>
        <button
          onClick={handleResetAll}
          className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1"
        >
          <RotateCcw className="h-4 w-4" />
          Reset All
        </button>
      </div>

      {/* Templates List */}
      <div className="space-y-6">
        {Object.entries(groupedTemplates).map(([type, typeTemplates]) => (
          <div key={type} className="space-y-3">
            <h4 className="font-medium text-brown-dark flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {type}
            </h4>
            
            <div className="space-y-3">
              {typeTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white/70 rounded-lg p-4 space-y-3 hover:bg-white/80 transition-colors"
                >
                  {/* Scenario */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-brown-dark">
                        {template.scenario}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.variables.map((variable) => (
                          <span
                            key={variable}
                            className="text-xs px-2 py-0.5 bg-squarage-green/10 text-squarage-green rounded-full"
                          >
                            {variable}
                          </span>
                        ))}
                      </div>
                    </div>
                    {template.currentTemplate !== template.defaultTemplate && (
                      <button
                        onClick={() => handleReset(template.id)}
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        title="Reset to default"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Template Editor */}
                  <div className="space-y-1">
                    {editingId === template.id ? (
                      <textarea
                        value={template.currentTemplate}
                        onChange={(e) => handleTemplateChange(template.id, e.target.value)}
                        onBlur={() => setEditingId(null)}
                        className="w-full px-3 py-2 bg-white border border-brown-light/30 rounded-lg text-sm text-brown-dark focus:outline-none focus:ring-2 focus:ring-squarage-green resize-none"
                        rows={2}
                        autoFocus
                      />
                    ) : (
                      <div
                        onClick={() => setEditingId(template.id)}
                        className="px-3 py-2 bg-white border border-brown-light/20 rounded-lg text-sm text-brown-dark cursor-pointer hover:border-squarage-green/50 transition-colors"
                      >
                        {template.currentTemplate}
                      </div>
                    )}
                    
                    {/* Show default if different */}
                    {template.currentTemplate !== template.defaultTemplate && (
                      <p className="text-xs text-brown-light">
                        Default: {template.defaultTemplate}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Preview Section */}
      <div className="border-t border-brown-light/20 pt-4">
        <h4 className="font-medium text-brown-dark mb-3">Preview Examples</h4>
        <div className="bg-white/70 rounded-lg p-4 space-y-2 text-sm text-brown-medium">
          <p>• Dylan created a new task: &quot;Review Q4 reports&quot;</p>
          <p>• Thomas assigned &quot;Fix login bug&quot; to you</p>
          <p>• Dylan marked &quot;Deploy v2.0&quot; as Completed</p>
          <p>• You have 3 tasks due today</p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4 border-t border-brown-light/20">
        {message && (
          <div className={`text-sm ${
            message.type === 'success' ? 'text-green-600' : 'text-red-600'
          }`}>
            {message.text}
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="ml-auto px-4 py-2 bg-squarage-green text-white font-medium rounded-lg hover:bg-squarage-green/90 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Templates'}
        </button>
      </div>
    </div>
  )
}