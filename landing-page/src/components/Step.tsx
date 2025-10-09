export const Step = ({
  step,
  title,
  description,
}: {
  step: string
  title: string
  description: string
}) => {
  return (
    <div className="p-4">
      <div className="flex items-center justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient flex items-center justify-center font-bold text-white text-2xl shadow-lg">
          {step}
        </div>
      </div>
      <h3 className="font-bold text-xl text-white mb-3">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  )
}
