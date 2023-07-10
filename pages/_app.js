import '@/styles/globals.css'
import { Raleway } from 'next/font/google'

const font = Raleway({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
})

export default function App({ Component, pageProps }) {
  return (
    <main className={font.className + ` select-none`}>
      <Component {...pageProps} />
    </main>
  )
}
