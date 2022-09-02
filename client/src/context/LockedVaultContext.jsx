import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { shortenAddress } from '../utils/shortenAddress'
import moment, { relativeTimeRounding } from 'moment'

import { lockedVaultABI, erc20ABI, networksConf, signatureType } from '../utils/constants'

export const LockedVaultContext = React.createContext()

const { ethereum } = window
let chainId
let provider
let erc20Contract
let lockedVaultContract

export const LockedVaultProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState('')
  const [formData, setFormData] = useState({ tokenAddress: '', amount: '' })

  const [isLoading, setIsLoading] = useState(false)
  const [alreadyApproved, setAlreadyApproved] = useState(false)
  const [nextUnlockTime, setNextUnlockTime] = useState('')
  const [isWithdrawLocked, setIsWithdrawLocked] = useState(false)
  const [currentNetworkConf, setCurrentNetworkConf] = useState()

  useEffect(() => {
    const changeAccount = async () => {
      await checkIfWalletIsConnected()
    }

    const initialize = async () => {
      await changeNetwork()
      await initializeLockedVaultContract()
      await initializeERC20Contract()
      await checkIfWalletIsConnected()
    }

    if (ethereum) {
      ethereum.on('chainChanged', () => {
        changeNetwork()
      })
      ethereum.on('accountsChanged', () => {
        changeAccount()
      })

      initialize()
    }
  }, [])

  useEffect(() => {
    const checkConnectedWalletAllowance = async () => {
      await checkWalletAllowance()
      await checkUnlockedTime()
    }
    if (currentAccount !== '') {
      checkConnectedWalletAllowance()
    }
  }, [currentAccount])

  useEffect(() => {
    const checkConnectedWalletAllowance = async () => {
      await checkUnlockedTime()
    }
    if (currentAccount !== '') {
      checkConnectedWalletAllowance()
    }
  }, [isLoading])

  const initializeContract = (address, abi) => {
    const signer = provider.getSigner()
    return new ethers.Contract(address, abi, signer)
  }
  const initializeLockedVaultContract = () => {
    lockedVaultContract = initializeContract(networksConf[chainId].lockedVaultAddress, lockedVaultABI)
    lockedVaultContract.on('StakeEth', async (stakerAddress) => {
      toast.success('Stake Eth transaction was completed')
      setIsLoading(false)
    })
    lockedVaultContract.on('StakeERC20', async (stakerAddress) => {
      toast.success('Stake ERC20 transaction was completed')
      setIsLoading(false)
    })

    lockedVaultContract.on('WithdrawalEth', async (stakerAddress) => {
      toast.success('Withdraw Eth transaction was completed')
      setIsLoading(false)
    })
    lockedVaultContract.on('WithdrawalERC20', async (stakerAddress) => {
      toast.success('Withdraw ERC20 transaction was completed')
      setIsLoading(false)
    })
  }

  const initializeERC20Contract = () => {
    erc20Contract = initializeContract(networksConf[chainId].erc20TokenAddress, erc20ABI)

    erc20Contract.on('Approval', async (owner) => {
      setIsLoading(false)
      toast.success('Approval transaction was completed', { closeOnClick: false })
      setAlreadyApproved(true)
    })
  }

  const ToastApprovingTx = ({ txHash }) => {
    return <div>
      Approving transaction sent at hash {shortenAddress(txHash)}
      <br/>
      <a
        className="underline cursor-pointer font-semibold"
        href={`${currentNetworkConf.explorer}${txHash}`}
        target="_blank" rel="noreferrer">Check in Explorer</a>
    </div>
  }

  const ToastTx = ({ txHash }) => {
    return <div>
      Transaction sent at hash {shortenAddress(txHash)}
      <br/>
      <a
        className="underline cursor-pointer font-semibold"
        href={`${currentNetworkConf.explorer}${txHash}`}
        target="_blank" rel="noreferrer">Check in Explorer</a>
    </div>
  }

  const handleChange = (e, name) => {
    name = name === undefined ? e.target.name : name
    let value = e.address !== undefined ? e.address : e.target.value

    if (name === 'amount' && parseFloat(value) <= 0) {
      value = ''
    }
    setFormData((prevState) => ({ ...prevState, [name]: value }))
  }

  const checkUnlockedTime = async () => {
    if (!ethereum) return alert('Please install metamask')

    if (!chainId) return
    const unlockTime = await lockedVaultContract.stakerUnlockTime(currentAccount)

    if (unlockTime.toNumber() <= moment().unix()) {
      setIsWithdrawLocked(false)
    } else {
      setIsWithdrawLocked(true)
      setNextUnlockTime(`${moment.unix(unlockTime.toNumber()).format('D MMMM YYYY')} at ${moment.unix(unlockTime.toNumber()).format('HH:mm')}`)
    }
  }
  const checkWalletAllowance = async () => {
    try {
      console.log('Entro en chek allowance')
      if (!ethereum) return alert('Please install metamask')
      console.log('Entro en chek allowance 1')
      if (!chainId) return
      console.log(currentAccount)
      console.log(networksConf[chainId].lockedVaultAddress)
      const allowance = await erc20Contract.allowance(currentAccount, networksConf[chainId].lockedVaultAddress)
      console.log('Entro en chek allowance 3')
      if (allowance.gt(0)) {
        console.log('Entro en chek allowance 4')
        setAlreadyApproved(true)
      } else {
        console.log('Entro en chek allowance 5')
        setAlreadyApproved(false)
      }
    } catch (error) {
      throw new Error(error)
    }
  }

  const changeNetwork = async () => {
    provider = new ethers.providers.Web3Provider(ethereum)
    const network = await provider.getNetwork()
    chainId = network.chainId
    setCurrentNetworkConf(networksConf[chainId])
  }
  const checkIfWalletIsConnected = async () => {
    try {
      if (!ethereum) return alert('Please install metamask')

      const accounts = await ethereum.request({ method: 'eth_accounts' })

      if (accounts.length) {
        setCurrentAccount(accounts[0])
      } else {
        console.log('No accounts found')
      }
    } catch (error) {
      throw new Error('No ethereum object')
    }
  }

  const connectWallet = async () => {
    try {
      if (!ethereum) return alert('Please install metamask')
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
      setCurrentAccount(accounts[0])
    } catch (error) {
      console.log(error)
      throw new Error(error)
    }
  }

  const handleApprove = async () => {
    if (!ethereum) return alert('Please install metamask')
    setIsLoading(true)

    try {
      const tx = await erc20Contract.approve(lockedVaultContract.address, ethers.constants.MaxUint256)
      toast.info(<ToastApprovingTx txHash={tx.hash}/>, {
        position: 'top-right',
        autoClose: 5000,
        closeOnClick: false
      })
    } catch (error) {
      setIsLoading(false)
    }
  }
  const stake = async () => {
    try {
      if (!ethereum) return alert('Please install metamask', { closeOnClick: false })
      setIsLoading(true)
      const { tokenAddress, amount } = formData
      // const lockedVaultContract = initializeLockedVaultContract()
      let txStake
      if (tokenAddress === '') {
        txStake = await lockedVaultContract.stakeEth({ value: ethers.utils.parseEther(amount) })
      } else {
        txStake = await lockedVaultContract.stakeToken(tokenAddress, ethers.utils.parseEther(amount))
      }

      toast.info(<ToastTx txHash={txStake.hash}/>, {
        position: 'top-right',
        closeOnClick: false,
        autoClose: 5000
      })
    } catch (error) {
      setIsLoading(false)
      console.log(error)
      throw new Error(error)
    }
  }
  const withdraw = async () => {
    console.log('ANTES DEL REQUEST')
    const { r, s, v } = await requestSignature()
    console.log('DESPUES DEL REQUEST')

    try {
      if (!ethereum) return alert('Please install metamask')
      setIsLoading(true)
      const { tokenAddress, amount } = formData

      if (tokenAddress === '') {
        await lockedVaultContract.withdrawEth(ethers.utils.parseEther(amount), r, s, v)
      } else {
        console.log(lockedVaultContract.address)
        const txStake = await lockedVaultContract.withdrawToken(tokenAddress, ethers.utils.parseEther(amount), r, s, v)
        toast.info(<ToastTx txHash={txStake.hash}/>, {
          position: 'top-right',
          autoClose: 5000,
          closeOnClick: false
        })
      }
    } catch (error) {
      setIsLoading(false)
      throw new Error(error)
    }
  }

  const mintTokens = async () => {
    try {
      if (!ethereum) return alert('Please install metamask')

      await erc20Contract.mint(currentAccount, ethers.utils.parseEther('100'))
    } catch (error) {
      throw new Error(error)
    }
  }

  const requestSignature = async () => {
    const amount = ethers.utils.parseEther(formData.amount)
    const data = {
      stakerAddress: currentAccount,
      amount
    }
    const domain = {
      name: 'LockedVault',
      version: '1',
      chainId,
      verifyingContract: currentNetworkConf.lockedVaultAddress
    }

    const signer = provider.getSigner()
    const signature = await signer._signTypedData(domain, signatureType, data)
    const { r, s, v } = ethers.utils.splitSignature(signature)
    return { r, s, v }
  }
  return (
    <LockedVaultContext.Provider value={{ connectWallet, mintTokens, currentAccount, formData, setFormData, handleChange, stake, withdraw, isLoading, alreadyApproved, handleApprove, nextUnlockTime, isWithdrawLocked, currentNetworkConf }}>
      {children}
      <ToastContainer />
    </LockedVaultContext.Provider>
  )
}
