'use client'

import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import Image from 'next/image'

type PaymentStep = 'connect' | 'pay' | 'success'
type LoadingState = 'metaMask' | 'walletConnect' | 'pay' | null

export const PaymentDemo = () => {
  const [step, setStep] = useState<PaymentStep>('connect')
  const [loading, setLoading] = useState<LoadingState>(null)
  const autoRunTimer = useRef<NodeJS.Timeout | null>(null)

  const proceedToStep = (nextStep: PaymentStep, delay: number) => {
    return setTimeout(() => {
      setStep(nextStep)
      setLoading(null)
    }, delay)
  }

  const handleConnect = (wallet: 'metaMask' | 'walletConnect') => {
    if (autoRunTimer.current) clearTimeout(autoRunTimer.current) // Cancel auto-run
    setLoading(wallet)
    proceedToStep('pay', 1500)
  }

  const handlePay = () => {
    if (autoRunTimer.current) clearTimeout(autoRunTimer.current) // Cancel auto-run
    setLoading('pay')
    proceedToStep('success', 2000)
  }

  useEffect(() => {
    if (autoRunTimer.current) clearTimeout(autoRunTimer.current)

    switch (step) {
      case 'connect':
        autoRunTimer.current = setTimeout(() => handleConnect('metaMask'), 4000)
        break
      case 'pay':
        autoRunTimer.current = setTimeout(handlePay, 4000)
        break
      case 'success':
        autoRunTimer.current = setTimeout(() => setStep('connect'), 3000)
        break
    }

    return () => {
      if (autoRunTimer.current) clearTimeout(autoRunTimer.current)
    }
  }, [step])

  const renderContent = () => {
    switch (step) {
      case 'connect':
        return (
          <div className="text-center">
            <Image
              src="/icons/metamask.svg"
              alt="MetaMask"
              width={64}
              height={64}
              className="mx-auto mb-4"
            />
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Connect your wallet</h3>
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => handleConnect('metaMask')}
                disabled={!!loading}
                className="w-full flex justify-center items-center bg-[#16a34a] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#15803d] transition-colors disabled:bg-gray-400"
              >
                {loading === 'metaMask' ? <Loader2 className="animate-spin" /> : 'Connect MetaMask'}
              </button>
              <button
                onClick={() => handleConnect('walletConnect')}
                disabled={!!loading}
                className="w-full flex justify-center items-center bg-white text-gray-800 font-bold py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:bg-gray-300"
              >
                {loading === 'walletConnect' ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  'WalletConnect'
                )}
              </button>
            </div>
          </div>
        )
      case 'pay':
        return (
          <div className="text-center">
            <h3 className="text-4xl font-bold text-gray-900">0.12 ETH</h3>
            <p className="text-gray-500 mb-6">≈ $450 USD</p>
            <button
              onClick={handlePay}
              disabled={!!loading}
              className="w-full flex justify-center items-center bg-[#16a34a] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#15803d] transition-colors disabled:bg-gray-400"
            >
              {loading === 'pay' ? <Loader2 className="animate-spin" /> : 'Pay with ETH'}
            </button>
          </div>
        )
      case 'success':
        return (
          <div className="text-center flex flex-col items-center justify-center h-full py-8">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800">Payment Successful!</h3>
            <p className="text-gray-500">Redirecting to confirmation...</p>
          </div>
        )
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-2xl p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Connect and Pay</h2>
        <span className="font-bold text-gray-700">$450 SGD</span>
      </div>

      <div className="space-y-4">
        <div className="w-full p-4 border border-gray-300 rounded-lg text-gray-500">
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              name="payment"
              className="form-radio"
              disabled
            />
            <span>Credit or debit card</span>
          </label>
        </div>

        <div className="w-full p-4 border-2 border-green-500 rounded-lg bg-green-50/30">
          <label className="flex items-center space-x-3 text-gray-800 font-semibold">
            <input
              type="radio"
              name="payment"
              className="form-radio"
              checked
              readOnly
            />
            <span>Pay with Crypto</span>
            <span className="text-xs font-bold text-white bg-green-600 px-2 py-0.5 rounded-md">
              NEW
            </span>
          </label>
        </div>
      </div>

      <div className="mt-6 bg-gray-50 rounded-lg p-8 min-h-[240px] flex items-center justify-center">
        {renderContent()}
      </div>
    </div>
  )
}
