import Image from 'next/image'

export const Header = () => {
  return (
    <header className="w-full container mx-auto p-6 flex justify-between items-center">
      <a className="flex items-center text-white no-underline hover:no-underline font-bold text-2xl lg:text-3xl">
        Vymera
      </a>
      <div className="flex items-center space-x-4">
        <a
          href="https://github.com/ankit875/vymera"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 transform hover:scale-110 duration-300 ease-in-out text-gray-400 hover:text-white"
        >
          <Image
            src="/icons/github.svg"
            alt="GitHub Icon"
            width={24}
            height={24}
          />
        </a>
        <a
          href="/zip/dist.zip"
          download="vymera-extension.zip"
          className="bg-gradient text-white font-bold py-2 px-6 rounded-lg hover:shadow-lg hover:bg-gradient-hover transform transition-all duration-300 ease-in-out"
        >
          Add to Browser
        </a>
      </div>
    </header>
  )
}
