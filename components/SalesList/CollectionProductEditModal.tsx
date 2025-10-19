'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Trash2, Edit2, ChevronRight, ChevronDown } from 'lucide-react'
import { Collection, Product } from '@/lib/salesTypes'
import ColorPicker from '@/components/UI/ColorPicker'
import useSalesStore from '@/lib/salesStore'

interface CollectionProductEditModalProps {
  isOpen: boolean
  onClose: () => void
}

// Default colors
const defaultColors = [
  '#4A9B4E', // Squarage Green
  '#F7901E', // Squarage Orange
  '#01BAD5', // Squarage Blue
  '#F04E23', // Squarage Red
  '#F5B74C', // Squarage Yellow
  '#9C27B0', // Purple
  '#795548', // Brown
  '#607D8B', // Blue Grey
]

export default function CollectionProductEditModal({
  isOpen,
  onClose,
}: CollectionProductEditModalProps) {
  const {
    collections,
    products,
    channels,
    addCollection,
    updateCollection,
    deleteCollection,
    addCollectionColor,
    removeCollectionColor,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductsByCollection,
    addChannel,
    updateChannel,
    deleteChannel,
  } = useSalesStore()

  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionColor, setNewCollectionColor] = useState(defaultColors[0])
  const [showNewCollectionColorPicker, setShowNewCollectionColorPicker] = useState(false)
  
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null)
  const [editingCollectionName, setEditingCollectionName] = useState('')
  const [showCollectionColorPicker, setShowCollectionColorPicker] = useState<string | null>(null)
  
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set())
  
  const [newProductName, setNewProductName] = useState<{ [key: string]: string }>({})
  const [newProductRevenue, setNewProductRevenue] = useState<{ [key: string]: string }>({})
  
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [editingProductName, setEditingProductName] = useState('')
  const [editingProductRevenue, setEditingProductRevenue] = useState('')

  const [newChannelName, setNewChannelName] = useState('')
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null)
  const [editingChannelName, setEditingChannelName] = useState('')
  
  const newColorButtonRef = useRef<HTMLButtonElement>(null)
  const colorButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen || !mounted) return null

  const handleAddCollection = () => {
    if (newCollectionName.trim()) {
      addCollection({
        name: newCollectionName.trim(),
        color: newCollectionColor,
      })
      setNewCollectionName('')
      setNewCollectionColor(defaultColors[0])
      setShowNewCollectionColorPicker(false)
    }
  }

  const handleDeleteCollection = (id: string) => {
    if (confirm(`Delete this collection and all its products?`)) {
      deleteCollection(id)
      setExpandedCollections(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const toggleCollectionExpanded = (id: string) => {
    setExpandedCollections(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleAddProduct = (collectionId: string) => {
    const name = newProductName[collectionId]?.trim()
    const revenue = newProductRevenue[collectionId]?.trim()
    
    if (name && revenue) {
      const revenueInCents = Math.round(parseFloat(revenue) * 100)
      if (!isNaN(revenueInCents)) {
        addProduct({
          name,
          revenue: revenueInCents,
          collectionId,
        })
        setNewProductName(prev => ({ ...prev, [collectionId]: '' }))
        setNewProductRevenue(prev => ({ ...prev, [collectionId]: '' }))
      }
    }
  }

  const handleDeleteProduct = (id: string) => {
    if (confirm('Delete this product?')) {
      deleteProduct(id)
    }
  }

  const startEditCollection = (collection: Collection) => {
    setEditingCollectionId(collection.id)
    setEditingCollectionName(collection.name)
    setShowCollectionColorPicker(null)
  }

  const saveEditCollection = () => {
    if (editingCollectionId && editingCollectionName.trim()) {
      updateCollection(editingCollectionId, { name: editingCollectionName.trim() })
      setEditingCollectionId(null)
      setEditingCollectionName('')
    }
  }

  const startEditProduct = (product: Product) => {
    setEditingProductId(product.id)
    setEditingProductName(product.name)
    setEditingProductRevenue((product.revenue / 100).toString())
  }

  const saveEditProduct = () => {
    if (editingProductId && editingProductName.trim() && editingProductRevenue) {
      const revenueInCents = Math.round(parseFloat(editingProductRevenue) * 100)
      if (!isNaN(revenueInCents)) {
        updateProduct(editingProductId, {
          name: editingProductName.trim(),
          revenue: revenueInCents,
        })
        setEditingProductId(null)
        setEditingProductName('')
        setEditingProductRevenue('')
      }
    }
  }

  const handleAddChannel = () => {
    if (newChannelName.trim()) {
      addChannel({ name: newChannelName.trim() })
      setNewChannelName('')
    }
  }

  const startEditChannel = (channelId: string, currentName: string) => {
    setEditingChannelId(channelId)
    setEditingChannelName(currentName)
  }

  const saveEditChannel = () => {
    if (!editingChannelId) return

    if (!editingChannelName.trim()) {
      setEditingChannelId(null)
      setEditingChannelName('')
      return
    }

    updateChannel(editingChannelId, { name: editingChannelName.trim() })
    setEditingChannelId(null)
    setEditingChannelName('')
  }

  const handleDeleteChannel = (channelId: string) => {
    if (confirm('Delete this channel option?')) {
      deleteChannel(channelId)
      if (editingChannelId === channelId) {
        setEditingChannelId(null)
        setEditingChannelName('')
      }
    }
  }

  const modalContent = (
    <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[80vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 flex items-center justify-between border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">
          Manage Collections & Products
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Add New Collection */}
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-700">Add New Collection</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCollection()}
              placeholder="Collection name..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green"
            />
            <div className="relative">
              <button
                ref={newColorButtonRef}
                onClick={() => setShowNewCollectionColorPicker(!showNewCollectionColorPicker)}
                className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
                style={{ backgroundColor: newCollectionColor }}
                title="Choose color"
              />
              <ColorPicker
                isOpen={showNewCollectionColorPicker}
                onClose={() => setShowNewCollectionColorPicker(false)}
                onSelect={(color) => {
                  setNewCollectionColor(color)
                  setShowNewCollectionColorPicker(false)
                }}
                currentColor={newCollectionColor}
                triggerRef={newColorButtonRef}
              />
            </div>
            <button
              onClick={handleAddCollection}
              disabled={!newCollectionName.trim()}
              className="px-4 py-2 bg-squarage-green text-white rounded-lg hover:bg-squarage-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
        </div>

        {/* Collections List */}
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-700">Collections</h3>
          {collections.length === 0 ? (
            <p className="text-gray-500 text-sm italic">No collections yet</p>
          ) : (
            <div className="space-y-2">
              {collections.map((collection) => {
                const collectionProducts = getProductsByCollection(collection.id)
                const isExpanded = expandedCollections.has(collection.id)
                
                return (
                  <div key={collection.id} className="border border-gray-200 rounded-lg">
                    {/* Collection Header */}
                    <div className="flex items-center gap-2 p-3 hover:bg-gray-50">
                      <button
                        onClick={() => toggleCollectionExpanded(collection.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                      
                      <button
                        ref={(el) => {
                          if (el) colorButtonRefs.current[collection.id] = el
                        }}
                        onClick={() => setShowCollectionColorPicker(
                          showCollectionColorPicker === collection.id ? null : collection.id
                        )}
                        className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors flex-shrink-0"
                        style={{ backgroundColor: collection.color }}
                        title="Change color"
                      />
                      <ColorPicker
                        isOpen={showCollectionColorPicker === collection.id}
                        onClose={() => setShowCollectionColorPicker(null)}
                        onSelect={(color) => {
                          updateCollection(collection.id, { color })
                          setShowCollectionColorPicker(null)
                        }}
                        currentColor={collection.color}
                        triggerRef={{ current: colorButtonRefs.current[collection.id] }}
                      />
                      
                      {editingCollectionId === collection.id ? (
                        <input
                          type="text"
                          value={editingCollectionName}
                          onChange={(e) => setEditingCollectionName(e.target.value)}
                          onBlur={saveEditCollection}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditCollection()
                            if (e.key === 'Escape') setEditingCollectionId(null)
                          }}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-squarage-green text-sm"
                          autoFocus
                        />
                      ) : (
                        <span className="flex-1 font-medium">{collection.name}</span>
                      )}
                      
                      <span className="text-sm text-gray-500">
                        {collectionProducts.length} product{collectionProducts.length !== 1 ? 's' : ''}
                      </span>
                      
                      {editingCollectionId !== collection.id && (
                        <button
                          onClick={() => startEditCollection(collection)}
                          className="text-gray-400 hover:text-squarage-green transition-colors"
                          title="Edit name"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteCollection(collection.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete collection"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    {/* Products and Colors Section */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50">
                        <div className="grid grid-cols-2 gap-4 p-3">
                          {/* Products Column */}
                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-2">Products</h4>
                            {/* Add New Product */}
                            <div className="flex gap-2 mb-3">
                              <input
                                type="text"
                                value={newProductName[collection.id] || ''}
                                onChange={(e) => setNewProductName(prev => ({
                                  ...prev,
                                  [collection.id]: e.target.value
                                }))}
                                placeholder="Product name..."
                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-squarage-green"
                              />
                              <input
                                type="number"
                                step="0.01"
                                value={newProductRevenue[collection.id] || ''}
                                onChange={(e) => setNewProductRevenue(prev => ({
                                  ...prev,
                                  [collection.id]: e.target.value
                                }))}
                                placeholder="Price..."
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-squarage-green"
                              />
                              <button
                                onClick={() => handleAddProduct(collection.id)}
                                disabled={!newProductName[collection.id]?.trim() || !newProductRevenue[collection.id]?.trim()}
                                className="px-3 py-1 bg-squarage-green text-white rounded text-sm hover:bg-squarage-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Add
                              </button>
                            </div>
                            
                            {/* Products List */}
                            {collectionProducts.length === 0 ? (
                              <p className="text-gray-500 text-xs italic">No products in this collection</p>
                            ) : (
                              <div className="space-y-1">
                                {collectionProducts.map(product => (
                                  <div key={product.id} className="flex items-center gap-2 bg-white p-2 rounded">
                                {editingProductId === product.id ? (
                                  <>
                                    <input
                                      type="text"
                                      value={editingProductName}
                                      onChange={(e) => setEditingProductName(e.target.value)}
                                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-squarage-green"
                                      autoFocus
                                    />
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editingProductRevenue}
                                      onChange={(e) => setEditingProductRevenue(e.target.value)}
                                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-squarage-green"
                                    />
                                    <button
                                      onClick={saveEditProduct}
                                      className="text-green-600 hover:text-green-700"
                                      title="Save"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={() => setEditingProductId(null)}
                                      className="text-gray-400 hover:text-gray-600"
                                      title="Cancel"
                                    >
                                      ✕
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <span className="flex-1 text-sm">{product.name}</span>
                                    <span className="text-sm font-medium text-gray-600">
                                      ${Math.round(product.revenue / 100)}
                                    </span>
                                    <button
                                      onClick={() => startEditProduct(product)}
                                      className="text-gray-400 hover:text-squarage-green transition-colors"
                                      title="Edit"
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProduct(product.id)}
                                      className="text-gray-400 hover:text-red-600 transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </>
                                )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {/* Collection Colors Column */}
                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-2">Collection Colors</h4>
                            <div className="bg-white p-3 rounded border border-gray-200">
                              <div className="flex flex-wrap gap-2 mb-3">
                                {(collection.availableColors || [collection.color]).map(color => (
                                  <div key={color} className="relative group">
                                    <div
                                      className="w-8 h-8 rounded border-2 border-gray-300"
                                      style={{ backgroundColor: color }}
                                      title={color}
                                    />
                                    {/* Don't allow removing the default collection color */}
                                    {color !== collection.color && (
                                      <button
                                        onClick={() => removeCollectionColor(collection.id, color)}
                                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center hover:bg-red-600"
                                        title="Remove color"
                                      >
                                        <X size={10} />
                                      </button>
                                    )}
                                  </div>
                                ))}
                                {/* Add new color button */}
                                <button
                                  ref={(el) => {
                                    if (el) colorButtonRefs.current[`add-${collection.id}`] = el
                                  }}
                                  onClick={() => setShowCollectionColorPicker(
                                    showCollectionColorPicker === `add-${collection.id}` ? null : `add-${collection.id}`
                                  )}
                                  className="w-8 h-8 rounded border-2 border-dashed border-gray-400 hover:border-gray-600 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                                  title="Add color"
                                >
                                  <Plus size={16} />
                                </button>
                                <ColorPicker
                                  isOpen={showCollectionColorPicker === `add-${collection.id}`}
                                  onClose={() => setShowCollectionColorPicker(null)}
                                  onSelect={(color) => {
                                    // Check if color is already in the collection
                                    const currentColors = collection.availableColors || [collection.color]
                                    if (!currentColors.includes(color)) {
                                      addCollectionColor(collection.id, color)
                                    }
                                    setShowCollectionColorPicker(null)
                                  }}
                                  currentColor={undefined}
                                  triggerRef={{ current: colorButtonRefs.current[`add-${collection.id}`] }}
                                />
                              </div>
                              <p className="text-xs text-gray-500">
                                These colors will be available for selection when creating sales with products from this collection.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        
        {/* Manage Channels */}
        <div className="space-y-3 border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Manage Channels</h3>
            <p className="text-xs text-gray-500">Channels populate the sales dropdown.</p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddChannel()
                }
              }}
              placeholder="Channel name..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green"
            />
            <button
              onClick={handleAddChannel}
              disabled={!newChannelName.trim()}
              className="px-4 py-2 bg-squarage-green text-white rounded-lg hover:bg-squarage-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus size={16} />
              Add
            </button>
          </div>

          {channels.length === 0 ? (
            <p className="text-gray-500 text-sm italic">No channels yet</p>
          ) : (
            <div className="space-y-2">
              {channels.map(channel => (
                <div key={channel.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                  {editingChannelId === channel.id ? (
                    <>
                      <input
                        type="text"
                        value={editingChannelName}
                        onChange={(e) => setEditingChannelName(e.target.value)}
                        onBlur={saveEditChannel}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            saveEditChannel()
                          } else if (e.key === 'Escape') {
                            setEditingChannelId(null)
                            setEditingChannelName('')
                          }
                        }}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-squarage-green"
                        autoFocus
                      />
                      <button
                        onClick={saveEditChannel}
                        className="text-green-600 hover:text-green-700"
                        title="Save channel"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => {
                          setEditingChannelId(null)
                          setEditingChannelName('')
                        }}
                        className="text-gray-400 hover:text-gray-600"
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-gray-700">{channel.name}</span>
                      <button
                        onClick={() => startEditChannel(channel.id, channel.name)}
                        className="text-gray-400 hover:text-squarage-green transition-colors"
                        title="Edit channel"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteChannel(channel.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete channel"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(
    <>
      {/* Full screen overlay with frosted glass effect */}
      <div 
        className="fixed inset-0 bg-white/20 backdrop-blur-xl z-40"
        onClick={onClose}
      />
      
      {/* Modal container */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          {modalContent}
        </div>
      </div>
    </>,
    document.body
  )
}
