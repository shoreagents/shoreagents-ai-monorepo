"use client"

import { useState } from "react"
import { Video } from "lucide-react"
import StaffSelectionModal from "./staff-selection-modal"

export default function FloatingCallButton() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-purple-600 text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-purple-500/50 animate-pulse"
        aria-label="Start video call"
      >
        <Video className="h-8 w-8" />
      </button>

      {showModal && (
        <StaffSelectionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}

