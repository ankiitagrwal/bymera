'use client'

import type { NextPage } from 'next'
import Image from 'next/image'
import { ShieldCheck, Zap, Globe, Replace } from 'lucide-react'
import { FeatureCard } from '@/components/FeatureCard'
import { Step } from '@/components/Step'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

const HomePage: NextPage = () => {
  return (
    <>
      <div className="leading-normal tracking-normal min-h-screen font-sans">
        <Header />

        <main className="container mx-auto px-6">
          <section className="py-20 md:py-28">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="flex flex-col justify-center items-start text-center md:text-left">
                <h1 className="my-4 text-4xl md:text-6xl text-white font-bold leading-tight">
                  The Universal Bridge for <span className="text-gradient">Crypto Payments.</span>
                </h1>
                <p className="leading-normal text-base md:text-xl mb-8 text-gray-400">
                  Vymera is a browser extension that enables crypto payments on ANY website that
                  accepts card payments, even if the merchant doesn&apos;t support cryptocurrency.
                </p>
                <button className="bg-gradient text-white font-bold text-lg py-4 px-10 rounded-lg focus:ring transform transition hover:scale-105 duration-300 ease-in-out">
                  Get Started for Free
                </button>
              </div>
              <div className="w-full p-4 md:p-8">
                <div className="bg-[#100f2a] rounded-xl shadow-2xl p-6 border border-white/10 transform rotate-3 hover:rotate-0 transition-transform duration-500 ease-in-out">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex space-x-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <p className="text-sm text-gray-500">Checkout</p>
                  </div>
                  <div className="bg-[#19183a] rounded-lg p-6">
                    <p className="text-white font-semibold mb-4">Pay with card</p>
                    <div className="bg-[#100f2a] h-10 rounded-md w-full mb-3 border border-white/10"></div>
                    <div className="flex space-x-3">
                      <div className="bg-[#100f2a] h-10 rounded-md w-1/2 border border-white/10"></div>
                      <div className="bg-[#100f2a] h-10 rounded-md w-1/2 border border-white/10"></div>
                    </div>
                    <div className="relative flex py-5 items-center">
                      <div className="flex-grow border-t border-gray-700"></div>
                      <span className="flex-shrink mx-4 text-gray-500 text-sm">
                        Or pay with Vymera
                      </span>
                      <div className="flex-grow border-t border-gray-700"></div>
                    </div>
                    <button className="bg-gradient w-full text-white font-bold py-3 px-8 rounded-lg transform transition hover:scale-105 duration-300 ease-in-out">
                      Connect Wallet & Pay
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            id="features"
            className="py-20"
          >
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Seamless Payments, Uncompromised Security
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Experience the future of online transactions with features designed for convenience
                and privacy.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard
                icon={<Replace />}
                title="Replaces Card Input"
                description="No more typing card numbers, expiry dates, or CVV. Enjoy a streamlined checkout process."
              />
              <FeatureCard
                icon={<Zap />}
                title="One-Click Crypto Payments"
                description="Simply send crypto through the plugin with a single click. It's fast, easy, and secure."
              />
              <FeatureCard
                icon={<ShieldCheck />}
                title="Privacy First"
                description="Your sensitive financial data is never shared with merchants, keeping your information safe."
              />
              <FeatureCard
                icon={<Globe />}
                title="Works Everywhere"
                description="No merchant integration is required. If a site accepts cards, it works with Vymera."
              />
            </div>
          </section>

          <section
            id="how-it-works"
            className="py-20"
          >
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                A Few Clicks is All It Takes
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Our process is designed to be intuitive and invisible. Here’s a look under the hood.
              </p>
            </div>
            <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 text-center">
              <Step
                step="1"
                title="Detect & Connect"
                description="Vymera automatically detects payment forms and securely injects a wallet connector."
              />
              <Step
                step="2"
                title="Pay & Generate"
                description="Your crypto payment is processed while a one-time virtual card is generated in parallel."
              />
              <Step
                step="3"
                title="Complete Payment"
                description="The payment is completed instantly, without you ever needing to enter card details."
              />
            </div>
          </section>
          <section
            id="architecture"
            className="py-20"
          >
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Under the Hood: Our Technology
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                A look at the robust and secure architecture that powers every Vymera transaction.
              </p>
            </div>
            <div className="flex justify-center px-4">
              <Image
                src="/vymera-architecture.png"
                alt="Flowchart of Vymera's technical architecture, showing the process from the browser extension to virtual card generation."
                width={1200}
                height={850}
                className="rounded-lg shadow-2xl border border-white/10 w-full h-auto"
                priority
              />
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  )
}

export default HomePage
