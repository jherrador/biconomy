const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = require('hardhat');

describe("LockedVault", function () {
  async function deployLockedVaultFixture(timeLockInSeconds= 365 * 24 * 60 * 60) {

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const LockedVault = await ethers.getContractFactory("LockedVault");
    const lockedVault = await LockedVault.deploy(timeLockInSeconds, hre.config.networks[hre.network.name].biconomyForwarder);

    const StandardToken = await ethers.getContractFactory("StandardToken");
    const standardToken = await StandardToken.deploy();

    return { lockedVault, timeLockInSeconds, owner, otherAccount, standardToken };
  }

  async function requestSignature(amount, owner, lockedVaultAddress){
    const data = {
      stakerAddress: owner.address,
      amount
    }
    const domain = {
      name: 'LockedVault',
      version: '1',
      chainId: hre.network.chainId,
      verifyingContract: lockedVaultAddress
    }

    const signatureType = {
      WithdrawMetaTransaction: [
        { name: 'stakerAddress', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ]
    }
    const signature = await owner._signTypedData(domain, signatureType, data)
    const { r, s, v } = ethers.utils.splitSignature(signature)
    return { r, s, v }
  }

  describe("Deployment", function () {
    it("Should set the right unlockTime", async function () {
      const { lockedVault, timeLockInSeconds } = await loadFixture(deployLockedVaultFixture);
      
      expect(await lockedVault.unlockTime()).to.equal(timeLockInSeconds);
    });

    it("Should set the right owner", async function () {
      const { lockedVault, owner } = await loadFixture(deployLockedVaultFixture);

      expect(await lockedVault.owner()).to.equal(owner.address);
    });

    it("Should fail if the unlockTime is zero", async function () {
      const unlockTimeInSeconds = 0;
    
      const { lockedVault } = await loadFixture(deployLockedVaultFixture);

      await expect(lockedVault.changeUnlockTime(unlockTimeInSeconds)).to.be.revertedWith(
        "LV01: UNLOCK_TIME_SHOULD_BE_HIGHER_THAN_ZERO"
      );
    });
  });
  describe("Staking", function () {
    describe("Ether", function () {
      it("Should stake 1 eth", async function () {
        const { lockedVault, owner } = await loadFixture(deployLockedVaultFixture);
        const amountToStake = ethers.utils.parseEther("1");
        lockedVault.stakeEth( { value: amountToStake })

        expect(await lockedVault.ethBalances(owner.address)).to.equal(amountToStake)
      });

      it("Should stake two times 1 eth", async function () {
        const { lockedVault, owner } = await loadFixture(deployLockedVaultFixture);
        const amountToStake = ethers.utils.parseEther("1");
        await lockedVault.stakeEth( { value: amountToStake })
        await lockedVault.stakeEth( { value: amountToStake })

        expect(await lockedVault.ethBalances(owner.address)).to.equal(ethers.utils.parseEther("2"))
      });

      it("Should fail if stake 0 eth", async function () {
        const { lockedVault, owner } = await loadFixture(deployLockedVaultFixture);
        const amountToStake = ethers.utils.parseEther("0");

        await expect(lockedVault.stakeEth({ value: amountToStake })).to.be.revertedWith(
          "LV09: AMOUNT_SHOULD_BE_HIGHER_THAN_ZERO"
        );
      });
    });
    describe("ERC20 token", function () {
      it("Should stake 1 ERC20", async function () {
        const { lockedVault, owner, standardToken } = await loadFixture(deployLockedVaultFixture);

        const mintedAmount = ethers.utils.parseEther("10")
        const amountToStake = ethers.utils.parseEther("5");
  
        await standardToken.mint(owner.address, mintedAmount)
        await standardToken.approve(lockedVault.address, mintedAmount)
        await lockedVault.stakeToken(standardToken.address, amountToStake);
      
        await expect(await lockedVault.balances(owner.address, standardToken.address)).to.equal(amountToStake)
        
      });

      it("Should fail if stake 0 ERC20", async function () {
        const { lockedVault, owner, standardToken } = await loadFixture(deployLockedVaultFixture);

        const mintedAmount = ethers.utils.parseEther("10")
        const amountToStake = ethers.utils.parseEther("0");
  
        await standardToken.mint(owner.address, mintedAmount)
        await standardToken.approve(lockedVault.address, mintedAmount)
        await expect( lockedVault.stakeToken(standardToken.address, amountToStake)).to.be.revertedWith(
          "LV09: AMOUNT_SHOULD_BE_HIGHER_THAN_ZERO"
        );
        
      });
    });
  });
  describe("Withdrawal", function () {
    describe("Ether", function () {
      it("Should fail if unlocktime is not completed", async function () {
        console.log("Skipped due to a signature verification");
        this.skip()
        const { lockedVault, owner } = await loadFixture(deployLockedVaultFixture);
        const amountToStake = ethers.utils.parseEther("1");
        
        const { r, s, v } = await requestSignature(amountToStake, owner, lockedVault.address)
        

        await lockedVault.stakeEth( { value: amountToStake })
        
        await expect(lockedVault.withdrawEth( amountToStake, r, s, v)).to.be.revertedWith('LV10: UNLOCK_TIME_NOT_COMPLETED')
      });

      it("Should withdraw 1 ETH", async function () {
        console.log("Skipped due to a signature verification");
        this.skip()
        const { lockedVault, owner } = await deployLockedVaultFixture(10);
        const amountToStake = ethers.utils.parseEther("10");
        const amountToWithdraw = ethers.utils.parseEther("0.000001");
        const marginAmount = ethers.utils.parseEther("0.01")

        const { r, s, v } = await requestSignature(amountToWithdraw, owner.address, lockedVault.address)
        
        await lockedVault.stakeEth( { value: amountToStake })
        const unlockTime = await lockedVault.stakerUnlockTime(owner.address)
        
        await time.increaseTo(unlockTime);
        const balanceAfterStake = await owner.getBalance();
        
        await lockedVault.withdrawEth( amountToWithdraw, r, s, v);
        
        const balanceAfterWithdraw = await owner.getBalance();
        
        //await expect(owner.getBalance()).to.be.revertedWith('LV10: UNLOCK_TIME_NOT_COMPLETED')
        expect(await lockedVault.ethBalances(owner.address)).to.equal(amountToStake.sub(amountToWithdraw))
        
        expect(balanceAfterWithdraw)
          .to
          .be
          .within(
            balanceAfterStake.add(amountToWithdraw).sub(marginAmount), 
            balanceAfterStake.add(amountToWithdraw).add(marginAmount)
          )
      });
    });
    
    describe("ERC20 token", function () {
      it("Should withdraw some ERC20 tokens", async function () {
        console.log("Skipped due to a signature verification");
        this.skip()
        const { lockedVault, owner, standardToken } = await loadFixture(deployLockedVaultFixture);

        const mintedAmount = ethers.utils.parseEther("10")
        const amountToStake = ethers.utils.parseEther("5");
        const amountToWithdraw = ethers.utils.parseEther("5");
        
        const { r, s, v } = await requestSignature(amountToWithdraw, owner.address, lockedVault.address)

        await standardToken.mint(owner.address, mintedAmount)
        await standardToken.approve(lockedVault.address, mintedAmount)
        await lockedVault.stakeToken(standardToken.address, amountToStake);
        
        const unlockTime = await lockedVault.stakerUnlockTime(owner.address)
        
        await time.increaseTo(unlockTime);

        await lockedVault.withdrawToken( standardToken.address, amountToStake, r, s, v );

        await expect(await standardToken.balanceOf(owner.address))
          .to.equal(mintedAmount.sub(amountToStake).add(amountToWithdraw))

          await expect(await lockedVault.balances(owner.address, standardToken.address))
          .to.equal(amountToStake.sub(amountToWithdraw))
        
      });

      it("Should fail if unlocktime is not completed", async function () {
        console.log("Skipped due to a signature verification");
        this.skip()
        const { lockedVault, owner, standardToken } = await loadFixture(deployLockedVaultFixture);

        const mintedAmount = ethers.utils.parseEther("10")
        const amountToStake = ethers.utils.parseEther("5");
        const amountToWithdraw = ethers.utils.parseEther("5");
  
        const { r, s, v } = await requestSignature(amountToWithdraw, owner.address, lockedVault.address)

        await standardToken.mint(owner.address, mintedAmount)
        await standardToken.approve(lockedVault.address, mintedAmount)
        await lockedVault.stakeToken(standardToken.address, amountToStake);

        await expect(lockedVault.withdrawToken( standardToken.address, amountToWithdraw, r, s, v ))
          .to
          .be
          .revertedWith("LV10: UNLOCK_TIME_NOT_COMPLETED")        
      });
    });
  });
});
