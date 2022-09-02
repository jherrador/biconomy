import React, { useContext } from 'react'
import { AiFillPlayCircle } from 'react-icons/ai'
import { SiEthereum } from 'react-icons/si'
import { BsInfoCircle } from 'react-icons/bs'
import { BiAlarm } from 'react-icons/bi'

import { Loader, ListBox } from './'
import { LockedVaultContext } from '../context/LockedVaultContext'
import { shortenAddress } from '../utils/shortenAddress'
const commonStyles = 'min-h-[70px] sm:px-0 px-2 sm:min-w-[100px] flex justify-center items-center border-[0.5px] border-gray-400 text-sm font-light text-white'

const Input = ({ placeholder, name, type, value, min, handleChange }) => (
  <input
    placeholder={placeholder}
    type={type}
    step="0.0001"
    value={value}
    name={name}
    min={min}
    onChange={(e) => handleChange(e, name)}
    className="my-2 w-full rounded-sm p-2 outline-none bg-transparent text-white border-none text-sm white-glassmorphism"

  />
)
const Welcome = () => {
  const { connectWallet, currentAccount, formData, stake, withdraw, handleChange, isLoading, mintTokens, alreadyApproved, handleApprove, nextUnlockTime, isWithdrawLocked, currentNetworkConf } = useContext(LockedVaultContext)

  const handleSubmit = (e) => {
    const { tokenAddress, amount } = formData
    e.preventDefault()
    if (tokenAddress === undefined || !amount) return
    stake()
  }

  const handleWithdraw = (e) => {
    const { tokenAddress, amount } = formData
    e.preventDefault()
    if (tokenAddress === undefined || !amount) return
    withdraw()
  }

  return (
    <div className='min-h-screen flex w-full justify-center items-center content-center'>
      <div className='flex mf:flex-row flex-col items-start justify-betewen md:p-20 py-20 py-12 px-4'>
        <div className="flex flex-1 justify-start flex-col mf:mr-10">
          <h1 className='text-3xl sm:text-5xl text-white text-gradient py-1'>Stake your liquidity</h1>
          <p className='text-left mt-5 text-white font-light md:w-10/12 w-11/12 text-base'>
            Stake & lock your liquidity for a period of time. <br/> Withdraw using <a className='font-semibold' href="https://biconomy.io" target="_blank" rel="noreferrer">Biconomy.io</a> to reduce the gass fees
          </p>

          {!currentAccount
            ? (
              <button
                type="button"
                onClick={connectWallet}
                className="flex flex-row justify-center items-center my-5 bg-[#2952e3] p-3 rounded-full cursor-pointer hover:bg-[#7090fa]">
                  <p className="text-white text-base font-semibold">Connect Wallet</p>
              </button>
              )
            : (
              <div className="columns-1 mt-10 md:columns-2">
                <button
                type="button"
                className='flex w-full flex-row items-center justify-center bg-[#2952e3] py-2 px-7 rounded-full cursor-pointer hover:bg-[#7090fa] text-white font-semibold'
                onClick={mintTokens}>
                  Mint ST
                </button>
                <a
                className='flex w-full flex-row mt-5 md:mt-0 items-center justify-center bg-[#2952e3] py-2 px-7 rounded-full cursor-pointer hover:bg-[#7090fa] text-white font-semibold'
                href={currentNetworkConf.faucetUrl}
                target="_blank" rel="noreferrer">
                  Faucet
                </a>
              </div>

              )}

        </div>
        <div className='flex flex-col flex-1 items-center justify-start w-full mf:mt-0 mt-10'>
          <div className='p-3 flex justify-end items-start flex-col rounded-xl h-40 sm:w-72 w-full my-5 eth-card-alternative'>
            <div className='flex justify-between flex-col w-full h-full'>
              <div className='flex justify-between items-start'>
                <div className='w-10 h-10 rounded-full border-2 border-white flex justify-center items-center'>
                  <SiEthereum fontSize={21} color="#fff"/>
                </div>
                <p className='text-white font-light text-sm'>
                  <i>{shortenAddress(currentAccount)}</i>
                </p>
                <BsInfoCircle fontSize={17} color="#fff"/>
              </div>
              <div>
                {isWithdrawLocked &&
                  (

                    <p className='flex text-white font-semibold text-sm mt-1'>
                      <BiAlarm fontSize={17} color="#fff" className='mr-1'/> Unlock: <i className=' font-normal'>{nextUnlockTime}</i>
                    </p>
                  )
                }

              </div>
            </div>
          </div>
          <div className="p-5 sm:w-96 w-full flex flex-col justify-start items-center blue-glassmorphism">
            <ListBox handleChange={handleChange}/>
            <Input placeholder="Amount" name="amount" type="number" handleChange={handleChange}/>
            <div className='h-[1px] w-full bg-gray-400 my-2'/>
            {isLoading
              ? (
              <Loader/>
                )
              : (
                <div className='w-full'>
                  {
                    (alreadyApproved || formData.tokenAddress === ''
                      ? <div className='w-full columns-1 md:columns-2'>
                          <button
                            type="button"
                            onClick={handleSubmit}
                            className="flex flex-row text-white w-full justify-center border-[1px] p-2 border-[#3d4f7c] bg-[#2952e3] rounded-full cursor-pointer hover:bg-[#7090fa] disabled:bg-[#9494944a] disabled:cursor-not-allowed"
                            disabled = {currentAccount === '' || formData.amount === ''}
                          >
                              Stake
                          </button>
                          <button
                            type="button"
                            onClick={handleWithdraw}
                            disabled = {currentAccount === '' || formData.amount === '' || isWithdrawLocked}
                            className="flex flex-row text-white w-full justify-center mt-2 md:mt-0 border-[1px] p-2 border-[#3d4f7c] rounded-full cursor-pointer justify-r bg-[#2952e3] hover:bg-[#7090fa] disabled:bg-[#9494944a] disabled:cursor-not-allowed"
                          >
                              Withdraw
                          </button>
                        </div>
                      : <button
                        type="button"
                        onClick={handleApprove}
                        disabled = {currentAccount === ''}
                        className="text-white w-full mt-2 border-[1px] p-2 border-[#3d4f7c] rounded-full cursor-pointer bg-[#2952e3] hover:bg-[#7090fa] disabled:bg-[#9494944a] disabled:cursor-not-allowed"
                        >
                          Approve
                        </button>
                    )
                  }
                </div>

                )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Welcome
