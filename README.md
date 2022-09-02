# Biconomy Project

This project contains a hardhat and React projects with the blockchain interaction.
The porpouse of this project is use Biconomy.io and Meta Transactions allowing the users gass fee.

Deployed Contracts in Goerli:
- ***LockedVault.sol*** => Locked Stacking/Withdraw contract.
    - Address: [0x38AC731d876de5702583000cF85Ef8D2B7464Daf](https://goerli.etherscan.io/address/0x38AC731d876de5702583000cF85Ef8D2B7464Daf).
- ***StandardToken.sol*** => Example ERC20 token
    - Address: [0x6B385003DB426F1b7fe87BDa2fDbc9A13dcd3C59](https://goerli.etherscan.io/address/0x6B385003DB426F1b7fe87BDa2fDbc9A13dcd3C59)

## Installation
1. Create a copy of .env.example and rename it to .env inside the /smart_contracts
    ```shell
    cd smart_contracts
    cp .env.example .env
    ```
2. Replace all env variables into /human-protocol-backend/.env
	```shell
    PRIVATE_KEY=
    ETHERSCAN_API_KEY=
    BSCSCAN_API_KEY=
    ```
3. Run the frontend
	```shell
    cd client
    npm run dev
    ```

Now the application is up & running.