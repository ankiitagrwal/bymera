import React from 'react'

type PersonaCardProps = {
  icon: React.ReactNode
  title: string
  description: string
}

export const PersonaCard: React.FC<PersonaCardProps> = ({ icon, title, description }) => {
  return (
    <div className="bg-gradient p-6 rounded-xl shadow-lg transition-transform hover:scale-105 duration-300">
      <div className="text-white mb-4 h-10 w-10">{icon}</div>
      <h3 className="font-bold text-xl text-white mb-2">{title}</h3>
      <p className="text-gray-300 leading-relaxed">{description}</p>
    </div>
  )
}
