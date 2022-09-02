// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Import this file to use console.log
import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

import "./Signature.sol";

contract LockedVault is ERC2771Context, Ownable, Signature {
    uint256 public unlockTime;
    uint256 public totalStaked;
    mapping(address => uint256) public stakerUnlockTime;
    mapping(address => mapping(address => uint256)) public balances;
    mapping(address => uint256) public ethBalances;

    enum ACTION {
        STAKED,
        WITHDRAW
    }

    event StakeEth(address stakerAddress, uint256 tokenAmount);
    event WithdrawalEth(address stakerAddress, uint256 tokenAmount);

    event StakeERC20(
        address stakerAddress,
        address tokenAddress,
        uint256 tokenAmount
    );

    event WithdrawalERC20(
        address stakerAddress,
        address tokenAddress,
        uint256 tokenAmount
    );

    constructor(uint256 _unlockTime, address trustedForwarder)
        ERC2771Context(trustedForwarder)
    {
        changeUnlockTime(_unlockTime);
    }

    function changeUnlockTime(uint256 _unlockTime) public onlyOwner {
        require(
            _unlockTime > 0,
            "LV01: UNLOCK_TIME_SHOULD_BE_HIGHER_THAN_ZERO"
        );

        unlockTime = _unlockTime;
    }

    function setStakerUnlockTime() private {
        stakerUnlockTime[_msgSender()] = block.timestamp + unlockTime;
    }

    function stakeEth() public payable {
        _stakeEth(_msgSender(), msg.value);
    }

    function _stakeEth(address stakerAddress, uint256 amount)
        private
        nonZeroAmount(amount)
        isValidAddress(stakerAddress)
    {
        setStakerUnlockTime();

        ethBalances[stakerAddress] += amount;
        totalStaked += amount;

        emit StakeEth(stakerAddress, amount);
    }

    function stakeToken(address tokenAddress, uint256 amount) external {
        _stakeToken(_msgSender(), tokenAddress, amount);
    }

    function _stakeToken(
        address stakerAddress,
        address tokenAddress,
        uint256 amount
    ) private nonZeroAmount(amount) isValidAddress(stakerAddress) {
        setStakerUnlockTime();

        bool transferred = IERC20(tokenAddress).transferFrom(
            stakerAddress,
            address(this),
            uint256(amount)
        );
        require(transferred, "LV02: TOKEN_FAILED_TRANSFER");

        balances[stakerAddress][tokenAddress] += amount;
        totalStaked += amount;

        emit StakeERC20(stakerAddress, tokenAddress, amount);
    }

    function withdrawEth(
        uint256 amount,
        bytes32 sigR,
        bytes32 sigS,
        uint8 sigV
    ) external {
        verifySignature(_msgSender(), amount, sigR, sigS, sigV);
        _withdrawEth(_msgSender(), amount);
    }

    function _withdrawEth(address stakerAddress, uint256 amount)
        private
        nonZeroAmount(amount)
        canWithdraw
        isValidAddress(stakerAddress)
    {
        require(
            amount <= ethBalances[stakerAddress],
            "LV03: NOT_ENOUGH_STAKED"
        );
        require(ethBalances[stakerAddress] > 0, "LV04: STAKED_BALANCE_ZERO");

        payable(stakerAddress).transfer(amount);

        ethBalances[stakerAddress] -= amount;
        totalStaked -= amount;

        emit WithdrawalEth(stakerAddress, amount);
    }

    function withdrawToken(
        address tokenAddress,
        uint256 amount,
        bytes32 sigR,
        bytes32 sigS,
        uint8 sigV
    ) external {
        verifySignature(_msgSender(), amount, sigR, sigS, sigV);
        _withdrawToken(_msgSender(), tokenAddress, amount);
    }

    function _withdrawToken(
        address stakerAddress,
        address tokenAddress,
        uint256 amount
    ) private nonZeroAmount(amount) canWithdraw isValidAddress(stakerAddress) {
        require(
            amount <= balances[stakerAddress][tokenAddress],
            "LV06: NOT_ENOUGH_STAKED"
        );
        require(
            balances[stakerAddress][tokenAddress] > 0,
            "LV07: STAKED_BALANCE_ZERO"
        );

        bool transferred = IERC20(tokenAddress).transfer(stakerAddress, amount);
        require(transferred, "LV08: TOKEN_FAILED_TRANSFER");

        balances[stakerAddress][tokenAddress] -= amount;
        totalStaked -= amount;

        emit WithdrawalERC20(stakerAddress, tokenAddress, amount);
    }

    function _msgSender()
        internal
        view
        override(Context, ERC2771Context)
        returns (address)
    {
        return ERC2771Context._msgSender();
    }

    function _msgData()
        internal
        view
        override(Context, ERC2771Context)
        returns (bytes memory)
    {
        return ERC2771Context._msgData();
    }

    modifier nonZeroAmount(uint256 amount) {
        require(amount > 0, "LV09: AMOUNT_SHOULD_BE_HIGHER_THAN_ZERO");
        _;
    }

    modifier canWithdraw() {
        require(
            block.timestamp >= stakerUnlockTime[_msgSender()],
            "LV10: UNLOCK_TIME_NOT_COMPLETED"
        );
        _;
    }

    modifier isValidAddress(address _address) {
        require(_address != address(0), "LV11 - ADDRESS CANNOT BE ZERO_ADDRES");
        _;
    }
}
