import Image from 'next/image'
import { parseSession } from '@/lib/parseSession'
import Logo from '@/assets/logo.png'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Turnstile, { useTurnstile } from "react-turnstile";
import config from '@/config.json'

import {
  TextArea,
  Input,
  Switch,
  Select,
  Checkbox
} from '@/components/FormTypes'

const formatUser = (user) => {
  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar
  }
}

export default function Home({ user, turnstileSiteKey }) {
  const router = useRouter()
  const turnstile = useTurnstile()

  const [banned, setBanned] = useState(null)
  const [error, setError] = useState(null)
  const [canAppeal, setCanAppeal] = useState(null)

  const [state, setState] = useState(0) // 0 = not sent, 1 = sending, 2 = sent

  const [banReason, setBanReason] = useState(null)
  const [answers, setAnswers] = useState({})
  const [captchaKey, setCaptchaKey] = useState(null)

  useEffect(() => {
    if (!user) return
    fetch(`/api/info`)
      .then(res => res.json())
      .then(data => {
        if (!data.success) return setError(data.message)
        setCanAppeal(data.canAppeal)
        setBanReason(data.banReason)
        setBanned(true)
      })
  }, [user])

  const submit = async () => {
    setError(null)
    setState(1)

    if (!captchaKey) {
      setError('Please complete the captcha')
      return setState(0)
    }

    for (const question of config.questions) {
      if (question.required && !answers[`q${config.questions.indexOf(question) + 1}`]) {
        if (question.type === 'switch') {
          setError(`Please agree to question ${config.questions.indexOf(question) + 1}!`)
        }
        else if (question.type === 'checkbox') {
          setError(`Please select at least one option for question ${config.questions.indexOf(question) + 1}!`)
        }
        else if (question.type === 'select') {
          setError(`Please select an option for question ${config.questions.indexOf(question) + 1}!`)
        }
        else {
          setError(`Please answer question ${config.questions.indexOf(question) + 1}!`)
        }
        return setState(0)
      }
      else if (question.min && answers[`q${config.questions.indexOf(question) + 1}`].length < question.min) {
        setError(`Question ${config.questions.indexOf(question) + 1} must be at least ${question.min} characters!`)
        return setState(0)
      }
      else if (question.max && answers[`q${config.questions.indexOf(question) + 1}`].length > question.max) {
        setError(`Question ${config.questions.indexOf(question) + 1} must be at most ${question.max} characters!`)
        return setState(0)
      }
    }

    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...answers
      })
    }).catch(() => {
      setState(0)
      setError('An error occurred')
      turnstile.reset()
    })

    if (error) return setState(0)

    if (res.status === 200) {
      setState(2)
    }
    else {
      const data = await res.json()
      setError(data.error)
      setState(0)
    }
    turnstile.reset()
  }

  return (
    <div className="py-24">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <Image src={Logo} alt="Logo" width={150} height={150} onDragStart={e => e.preventDefault()} onContextMenu={e => e.preventDefault()} />
        <h1 className="text-4xl sm:text-6xl font-bold">
          Appeal your server ban
        </h1>
        <button
          className="bg-[#5865F2] hover:bg-[#3945c1] flex items-center transition text-white font-semibold text-md py-2 px-4 rounded-md mt-5"
          onClick={() => router.push('/api/auth/logout')}
        >
          Logout
        </button>
      </main>

      <div className="flex flex-col items-center justify-center w-full flex-1 px-6 text-center mt-10 max-w-2xl m-auto">
        {error && (
          <div className="bg-red-500/25 text-white p-4 rounded-md border-l-4 border-l-red-500 font-bold w-full mb-4">
            Error!
            <p className="text-sm text-red-100 mt-2 font-normal">{error}</p>
          </div>
        )}
        {banned === null && (
          <div className="bg-yellow-500/25 text-white p-4 rounded-md border-l-4 border-l-yellow-500 font-bold w-full">
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Fetching info...
            </div>
            <p className="text-sm text-gray-100 mt-2 font-normal">If this takes longer than 10 seconds, please refresh the page.</p>
          </div>
        )}
        {canAppeal === false && (
         <div className="bg-green-500/25 text-white p-4 rounded-md border-l-4 border-l-green-500 font-bold w-full">
            You're not banned!
            <p className="text-sm text-gray-100 mt-2 font-normal">If you think this is a mistake, please contact a staff member.</p>
          </div>
        )}
        {canAppeal === true && (
          <div className="mx-auto w-full max-w-xl">
            {banReason && (
              <div className="flex flex-col gap-y-4 mb-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold leading-6 text-gray-200">
                    Ban Reason (Fetched from Discord)
                  </label>
                  <input
                    rows={4}
                    className="block mt-2.5 w-full disabled:bg-white/5 bg-white/10 disabled:cursor-not-allowed rounded-md border-0 px-3.5 py-2 text-gray-200 shadow-sm ring-1 ring-inset ring-white/20 disabled:ring-white/10 placeholder:text-gray-400 focus:outline-none focus:ring-white/50 transition sm:text-sm sm:leading-6"
                    value={banReason}
                    disabled={true}
                  />
                </div>
              </div>
            )}
              <div className="flex flex-col gap-y-4">
                {config.questions.map((question, i) => (
                  <div className="sm:col-span-2">
                    {question.type !== "switch" && (
                      <label htmlFor={`q${i + 1}`} className="block text-sm font-semibold leading-6 text-gray-200">
                        {question.title}
                        {question.required && <span className="text-red-500 ml-1">*</span> || <span className="text-gray-400 ml-1"> (Optional)</span>}
                      </label>
                    )}
                    <div className="mt-2.5">
                      {question.type === 'textarea' && (
                        <TextArea answers={answers} setAnswers={setAnswers} i={i} state={state} question={question} />
                      ) || question.type === 'input' && (
                        <Input answers={answers} setAnswers={setAnswers} i={i} state={state} question={question} />
                      ) || question.type === 'switch' && (
                        <Switch answers={answers} setAnswers={setAnswers} i={i} state={state} question={question} />
                      ) || question.type === 'select' && (
                        <Select answers={answers} setAnswers={setAnswers} i={i} state={state} question={question} />
                      ) || question.type === 'checkbox' && (
                        <Checkbox answers={answers} setAnswers={setAnswers} i={i} state={state} question={question} />
                      )}
                    </div>
                  </div>
                ))}
                <Turnstile
                  sitekey={turnstileSiteKey}
                  onVerify={(token) => {
                    setCaptchaKey(token)
                  }}
                  className="m-auto"
                />
            </div>
            <div className="mt-5">
              <button
                className="block w-full rounded-md bg-white/10 disabled:bg-white/5 disabled:cursor-not-allowed px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-white/20 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                onClick={submit}
                disabled={state !== 0}
              >
                {state === 0 && 'Submit Appeal'}
                {state === 1 && (
                  <svg className="animate-spin inline-block w-5 h-5 text-white mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={4} />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {state === 2 && 'Submitted!'}
              </button>
            </div>
        </div>
        )}
      </div>
    </div>
  )
}

export async function getServerSideProps({ req, res }) {
  const session = await parseSession({ req })

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }
  }

  return {
    props: {
      user: formatUser(session.user),
      turnstileSiteKey: process.env.turnstileSiteKey
    },
  }
}