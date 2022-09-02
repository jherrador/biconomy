/* eslint-disable react/react-in-jsx-scope */
/* This example requires Tailwind CSS v2.0+ */
import { Fragment, useState, useContext, useEffect } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { BsChevronExpand, BsCheck2 } from 'react-icons/bs'
import { tokensList } from '../utils/constants'
import { LockedVaultContext } from '../context/LockedVaultContext'

const tokens = tokensList
function classNames (...classes) {
  return classes.filter(Boolean).join(' ')
}

const ListBox = () => {
  const [selected, setSelected] = useState(tokens[0])

  const { handleChange } = useContext(LockedVaultContext)

  useEffect(() => {
    handleChange(selected, 'tokenAddress')
  }, [selected])

  return (
    <Listbox value={selected} onChange={setSelected}>
      {({ open }) => (
        <>
          <div className="relative mt-1 w-full">
            <Listbox.Button className="outline-none bg-transparent text-white border-none text-sm white-glassmorphism relative w-full cursor-default rounded-md border border-gray-300 py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
            <span className="flex items-center">
            <img src={selected.logo} alt="" className="h-6 w-6 flex-shrink-0 rounded-full" />
                <span className="ml-3 block truncate">{selected.name}</span>
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                <BsChevronExpand className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="bg-[#1e2742] text-white  absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {tokens.map((token) => (
                  <Listbox.Option
                    key={token.id}
                    className={({ active }) =>
                      classNames(
                        active ? 'text-white bg-indigo-600' : 'text-gray-900',
                        'relative cursor-default select-none py-2 pl-3 pr-9'
                      )
                    }
                    value={token}
                  >
                    {({ selected, active }) => (
                      <>
                        <div className="flex items-center text-white">
                        <img src={token.logo} alt="" className="h-6 w-6 flex-shrink-0 rounded-full" />
                        <span
                            className={classNames(selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate')}
                          >
                            {token.name}
                          </span>
                        </div>

                        {selected
                          ? (
                          <span
                            className={classNames(
                              active ? 'text-white' : 'text-indigo-600',
                              'absolute inset-y-0 right-0 flex items-center pr-4'
                            )}
                          >
                            <BsCheck2 className="h-5 w-5" aria-hidden="true" />
                          </span>
                            )
                          : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  )
}

export default ListBox
