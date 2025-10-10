import Image from 'next/image'
import Link from 'next/link'
import { MAIN_CONTRACT_ADDRESS, BASE_CHAIN_SEPOLIA_BASE_URL } from '@/constants'

export const Footer = () => {
  return (
    <footer className="w-full container mx-auto border-t border-white/10 p-6">
      <div className="flex flex-col md:flex-row justify-between items-center text-center">
        <div className="text-gray-500 mb-4 md:mb-0 md:text-left text-xl">
          <p>&copy; {new Date().getFullYear()} Bymera. All rights reserved.</p>
          <p className="text-xl mt-1">
            Contract Address:{' '}
            <Link
              href={`${BASE_CHAIN_SEPOLIA_BASE_URL}/${MAIN_CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-white underline hover:no-underline  transition-colors"
            >
              {MAIN_CONTRACT_ADDRESS}
            </Link>
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <a
            href="https://github.com/ankit875/bymera"
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
        </div>
      </div>
    </footer>
  )
}
