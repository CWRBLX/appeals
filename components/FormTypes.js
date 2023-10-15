import { Switch as SwitchComponent } from '@headlessui/react'
import { useState, useEffect } from 'react'

const classNames = (...classes) => classes.filter(Boolean).join(' ')

export function TextArea({ answers, setAnswers, i, state, question, questions }) {
    const [err, setErr] = useState('')

    return (
        <>
            <textarea
                name={`q${i + 1}`}
                id={`q${i + 1}`}
                rows={4}
                className={`block w-full disabled:bg-white/5 bg-white/10 disabled:cursor-not-allowed rounded-md border-0 px-3.5 py-2 text-gray-200 shadow-sm ring-1 ring-inset ring-white/20 disabled:ring-white/10 placeholder:text-gray-400 focus:outline-none focus:ring-white/50 transition sm:text-sm sm:leading-6 ${err ? 'ring-red-500' : ''}`}
                defaultValue={''}
                onChange={e => setAnswers({ ...answers, [`q${i + 1}`]: e.target.value })}
                value={answers[`q${i + 1}`]}
                disabled={state !== 0}
                maxLength={1000}
                minLength={25}
                placeholder={question?.placeholder || ''}
                style={{ minHeight: '100px', maxHeight: '200px' }}
                onBlur={() => {
                    if (question.required && !answers[`q${questions.indexOf(question) + 1}`]) {
                        if (question.type === 'switch') {
                            setErr(`Please agree to question ${questions.indexOf(question) + 1}!`)
                        }
                        else if (question.type === 'checkbox') {
                            setErr(`Please select at least one option for question ${questions.indexOf(question) + 1}!`)
                        }
                        else if (question.type === 'select') {
                            setErr(`Please select an option for question ${questions.indexOf(question) + 1}!`)
                        }
                        else {
                            setErr(`Please answer question ${questions.indexOf(question) + 1}!`)
                        }
                    }
                    else if (question.min && answers[`q${questions.indexOf(question) + 1}`].length < question.min) {
                        setErr(`Question ${questions.indexOf(question) + 1} must be at least ${question.min} characters!`)
                    }
                    else if (question.max && answers[`q${questions.indexOf(question) + 1}`].length > question.max) {
                        setErr(`Question ${questions.indexOf(question) + 1} must be at most ${question.max} characters!`)
                    }
                    else {
                        setErr('')
                    }
                }}
            />
            {err && <p className="text-red-500 text-sm mt-1">{err}</p>}
        </>
    )
}

export function Input({ answers, setAnswers, i, state, question, questions }) {
    const [err, setErr] = useState('')

    return (
        <input
            type="text"
            name={`q${i + 1}`}
            id={`q${i + 1}`}
            className="block mt-2.5 w-full disabled:bg-white/5 bg-white/10 disabled:cursor-not-allowed rounded-md border-0 px-3.5 py-2 text-gray-200 shadow-sm ring-1 ring-inset ring-white/20 disabled:ring-white/10 placeholder:text-gray-400 focus:outline-none focus:ring-white/50 transition sm:text-sm sm:leading-6"
            defaultValue={''}
            onChange={e => setAnswers({ ...answers, [`q${i + 1}`]: e.target.value })}
            value={answers[`q${i + 1}`]}
            disabled={state !== 0}
            maxLength={1000}
            minLength={25}
            placeholder={question?.placeholder || ''}
            onBlur={() => {
                if (question.required && !answers[`q${questions.indexOf(question) + 1}`]) {
                    if (question.type === 'switch') {
                        setErr(`Please agree to question ${questions.indexOf(question) + 1}!`)
                    }
                    else if (question.type === 'checkbox') {
                        setErr(`Please select at least one option for question ${questions.indexOf(question) + 1}!`)
                    }
                    else if (question.type === 'select') {
                        setErr(`Please select an option for question ${questions.indexOf(question) + 1}!`)
                    }
                    else {
                        setErr(`Please answer question ${questions.indexOf(question) + 1}!`)
                    }
                }
                else if (question.min && answers[`q${questions.indexOf(question) + 1}`].length < question.min) {
                    setErr(`Question ${questions.indexOf(question) + 1} must be at least ${question.min} characters!`)
                }
                else if (question.max && answers[`q${questions.indexOf(question) + 1}`].length > question.max) {
                    setErr(`Question ${questions.indexOf(question) + 1} must be at most ${question.max} characters!`)
                }
                else {
                    setErr('')
                }
            }}
        />
    )
}

export function Switch({ answers, setAnswers, i, state, question, questions }) {
    const [err, setErr] = useState('')

    return (
        <>
            <div className="flex justify-center">
                <SwitchComponent.Group as="div" className="flex">
                    <SwitchComponent
                        checked={answers[`q${i + 1}`]}
                        onChange={e => {
                            setAnswers({ ...answers, [`q${i + 1}`]: e })
                            if (question.required && !e) {
                                if (question.type === 'switch') {
                                    setErr(`Please agree to question ${questions.indexOf(question) + 1}!`)
                                }
                                else if (question.type === 'checkbox') {
                                    setErr(`Please select at least one option for question ${questions.indexOf(question) + 1}!`)
                                }
                                else if (question.type === 'select') {
                                    setErr(`Please select an option for question ${questions.indexOf(question) + 1}!`)
                                }
                                else {
                                    setErr(`Please answer question ${questions.indexOf(question) + 1}!`)
                                }
                            }
                            else {
                                setErr('')
                            }
                        }}
                        className={classNames(
                        answers[`q${i + 1}`] ? 'bg-[#5865F2]' : 'bg-gray-500',
                            'relative inline-flex h-6 w-11 flex-shrink-0 m-auto cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-none'
                        )}
                            
                    >
                        <span
                            aria-hidden="true"
                            className={classNames(
                                answers[`q${i + 1}`] ? 'translate-x-5' : 'translate-x-0',
                                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                            )}
                        />
                    </SwitchComponent>
                    <SwitchComponent.Label as="span" className="flex flex-grow flex-col text-left ml-3">
                        <SwitchComponent.Description as="span" className="text-sm text-gray-200 font-semibold">
                            {question?.title} {question.required && <span className="text-red-500 ml-1">*</span> || <span className="text-gray-400 ml-1"> (Optional)</span>}
                        </SwitchComponent.Description>
                    </SwitchComponent.Label>
                </SwitchComponent.Group>
            </div>
            {err && <p className="text-red-500 text-sm mt-1">{err}</p>}
        </>
    )
}

export function Select({ answers, setAnswers, i, state, question, questions }) {
    const [err, setErr] = useState('')

    return (
        <select
            id={`q${i + 1}`}
            name={`q${i + 1}`}
            className="block mt-2.5 w-full disabled:bg-white/5 bg-white/10 disabled:cursor-not-allowed rounded-md border-0 px-3.5 py-2 text-gray-200 shadow-sm ring-1 ring-inset ring-white/20 disabled:ring-white/10 placeholder:text-gray-400 focus:outline-none focus:ring-white/50 transition sm:text-sm sm:leading-6"
            defaultValue={''}
            onChange={e => setAnswers({ ...answers, [`q${i + 1}`]: e.target.value })}
            value={answers[`q${i + 1}`]}
            disabled={state !== 0}
            maxLength={1000}
            minLength={25}
            placeholder={question?.placeholder || ''}
        >
            <option value="" disabled selected hidden>{question?.placeholder || ''}</option>
            {question?.options?.map((option, i) => (
                <option key={i} value={option}>{option}</option>
            ))}
        </select>
    )
}