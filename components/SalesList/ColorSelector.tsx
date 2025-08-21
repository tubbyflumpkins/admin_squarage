'use client'

import { useState, useRef } from 'react'
import useSalesStore from '@/lib/salesStore'
import ColorPicker from '@/components/UI/ColorPicker'

interface ColorSelectorProps {
  saleId: string
  productId?: string
  selectedColor?: string
}

export default function ColorSelector({ saleId, productId, selectedColor }: ColorSelectorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const colorButtonRef = useRef<HTMLButtonElement>(null)
  
  const { products, collections, updateSale } = useSalesStore()
  
  // Get the product and its collection
  const product = productId ? products.find(p => p.id === productId) : undefined
  const collection = product ? collections.find(c => c.id === product.collectionId) : undefined
  
  // Get available colors from the collection
  const availableColors = collection?.availableColors || (collection ? [collection.color] : [])
  
  // Use selected color, or fall back to collection's default color
  const displayColor = selectedColor || collection?.color
  
  const handleColorSelect = (color: string) => {
    updateSale(saleId, { selectedColor: color })
    setShowColorPicker(false)
  }
  
  if (!product || !collection) {
    return (
      <button
        disabled
        className="w-6 h-6 rounded border-2 border-gray-200 bg-gray-100 cursor-not-allowed"
        title="Select a product first"
      />
    )
  }
  
  return (
    <>
      <button
        ref={colorButtonRef}
        onClick={() => setShowColorPicker(!showColorPicker)}
        className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors"
        style={{ backgroundColor: displayColor }}
        title="Select color"
      />
      {showColorPicker && (
        <div className="fixed z-50 mt-8">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-2">
            <div className="flex gap-1">
              {availableColors.map(color => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className={`w-6 h-6 rounded border-2 hover:scale-110 transition-transform ${
                    selectedColor === color ? 'border-squarage-black ring-1 ring-squarage-green' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}