export const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) => {
  return (
    <div className="bg-[#14133e50] p-6 rounded-xl border border-white/10 transition-all duration-300 hover:border-[#C8ACD6]/50 hover:bg-[#1f1d5350]">
      <div className="text-[#C8ACD6] mb-4 h-8 w-8">{icon}</div>
      <h3 className="font-bold text-lg text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  )
}
