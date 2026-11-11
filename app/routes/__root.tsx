import React, { useEffect } from 'react'
import {
  Outlet,
  ScrollRestoration,
  createRootRoute,
} from '@tanstack/react-router'
import { Meta, Scripts } from '@tanstack/react-start'
import appCss from '../styles/app.css?url'
import { getClientWalletSelector } from '../lib/near'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        title: 'near-bail',
      },
      {
        name: 'description',
        content:
          'a 7-stage trick puzzle game on near testnet where every mistake feeds a self-patching ai warden vault.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Gloria+Hallelujah&display=swap',
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  useEffect(() => {
    // Initialize @near-wallet-selector/core strictly on the client side
    // so Cloudflare Worker SSR never touches window or localStorage.
    getClientWalletSelector().catch(() => {})
  }, [])

  return (
    <html lang="en">
      <head>
        <Meta />
      </head>
      <body className="min-h-screen bg-[#faf8f2] text-[#111] antialiased">
        {/* Global SVG Sketch Filter (No Rigid Lines) */}
        <svg
          width="0"
          height="0"
          className="pointer-events-none absolute opacity-0"
          aria-hidden="true"
        >
          <defs>
            <filter id="sketch" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.03"
                numOctaves="3"
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="1.8"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>

        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
