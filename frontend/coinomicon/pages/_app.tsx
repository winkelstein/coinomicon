import '@/styles/globals.css'
import Head from 'next/head'
import type { AppProps } from 'next/app'
import { NextUIProvider, createTheme } from '@nextui-org/react'

const darkTheme = createTheme({ type: 'dark' })

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Coinomicon</title>
      </Head>
      <NextUIProvider theme={darkTheme}>
        <Component {...pageProps} />
      </NextUIProvider>
    </>
  )
}
