
const hre = require("hardhat");
async function main() {
  const timeLockInSeconds= 365 * 24 * 60 * 60 // 1 Year
  // Contracts are deployed using the first signer/account by default
  const [owner, otherAccount] = await ethers.getSigners();

  const StandardToken = await ethers.getContractFactory("StandardToken");
  const standardToken = await StandardToken.deploy();

  console.log(`StandardToken deployed on ${hre.network.name} at address ${standardToken.address}`);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
