// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";

contract Signature {
    struct EIP712Domain {
        string name;
        string version;
        uint256 chainId;
        address verifyingContract;
    }

    struct WithdrawMetaTransaction {
        address stakerAddress;
        uint256 amount;
    }

    bytes32 internal constant EIP712_DOMAIN_TYPEHASH =
        keccak256(
            bytes(
                "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
            )
        );
    bytes32 internal constant WITHDRAW_META_TRANSACTION_TYPEHASH =
        keccak256(
            bytes(
                "WithdrawMetaTransaction(address stakerAddress,uint256 amount)"
            )
        );
    bytes32 internal DOMAIN_SEPARATOR =
        keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256(bytes("LockedVault")),
                keccak256(bytes("1")),
                5,
                address(this)
            )
        );

    function verifySignature(
        address userAddress,
        uint256 amount,
        bytes32 r,
        bytes32 s,
        uint8 v
    ) public view {
        WithdrawMetaTransaction memory metaTx = WithdrawMetaTransaction({
            stakerAddress: userAddress,
            amount: amount
        });

        bytes32 message = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        WITHDRAW_META_TRANSACTION_TYPEHASH,
                        metaTx.stakerAddress,
                        metaTx.amount
                    )
                )
            )
        );

        // Verify the userAddress is not address zero
        require(userAddress != address(0), "invalid-address-0");

        // Verify the userAddress with the address recovered from the signatures
        require(
            userAddress == ecrecover(message, v, r, s),
            "invalid-signatures"
        );
    }

    function splitSignature(bytes memory sig)
        public
        pure
        returns (
            uint8 v,
            bytes32 r,
            bytes32 s
        )
    {
        require(sig.length == 65);

        assembly {
            // first 32 bytes, after the length prefix.
            r := mload(add(sig, 32))
            // second 32 bytes.
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes).
            v := byte(0, mload(add(sig, 96)))
        }
        return (v, r, s);
    }
}
