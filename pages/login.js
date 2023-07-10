import Image from 'next/image'
import { parseSession } from '@/lib/parseSession'
import Logo from '@/assets/logo.png'
import { useRouter } from 'next/router'

import {
  BsDiscord
} from 'react-icons/bs'

export default function Login({ }) {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <Image src={Logo} alt="Logo" width={150} height={150} onDragStart={e => e.preventDefault()} onContextMenu={e => e.preventDefault()} />
        <h1 className="text-4xl sm:text-6xl font-bold">
          Appeal your server ban
        </h1>
        <button
          className="bg-[#5865F2] hover:bg-[#3945c1] flex items-center transition text-white font-semibold text-md py-2 px-4 rounded-md mt-5"
          onClick={() => router.push('/api/auth')}
        >
          <BsDiscord className='mr-2 h-6 w-6'/> Login with Discord
        </button>

        <div className="mt-12 text-md text-gray-300">
          <span key="permsListKey" className="font-bold">What permissions do we require?</span>
          <br />
          <div className="text-sm space-y-1 flex flex-col">
            <span key="guildsJoinKey"><code>guilds.join</code> - This allows us to automatically add you to the server if your appeal is accepted.</span>
            <span key="identifyKey"><code>identify</code> - This allows us to get your Discord username, avatar and ID to be able to find your ban.</span>
            <span key="emailKey"><code>email</code> - This allows the site to automatically notify you of the status of your appeal.</span>
          </div>
        </div>
      </main>
    </div>
  )
}

export async function getServerSideProps({ req, res }) {
  const session = await parseSession({ req })

  if (session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }

  return {
    props: {}
  }
}