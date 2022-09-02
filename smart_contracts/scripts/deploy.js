
const hre = require("hardhat");
async function main() {
  const timeLockInSeconds= 3 * 60 // 3 Minutes
  // Contracts are deployed using the first signer/account by default
  const [owner, otherAccount] = await ethers.getSigners();

  const LockedVault = await ethers.getContractFactory("LockedVault");
  const lockedVault = await LockedVault.deploy(timeLockInSeconds, hre.config.networks[hre.network.name].biconomyForwarder);

  console.log(`LockedVault deployed on ${hre.network.name} at address ${lockedVault.address}`);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
