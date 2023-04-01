// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./interfaces/ICoinomiconFactory.sol";

/// @title Coinomicon Exchange
/// @author treug0lnik041
/// @notice Should only be deployed by Factory contract
contract CoinomiconExchange {
    struct Order {
        address trader;
        uint256 price;
        uint256 amount;
        uint256 date;
        bool buy;
        bool active;
        bool isLimit;
    }

    address public token;
    address factory;
    Order[] public orderBook;
    uint256 startingPrice;

    constructor(address _token, uint256 _startingPrice) {
        require(_token != address(0), "Invalid token address");
        require(
            msg.sender.code.length > 0,
            "Contract could be deployed only from factory contract"
        );
        token = _token;
        factory = msg.sender;
        startingPrice = _startingPrice;
    }

    function _getImplementation() private view returns (address) {
        return ICoinomiconFactory(factory)._getExchangeImplementation();
    }

    function _delegate(address _implementation) internal virtual {
        assembly {
            // Copy msg.data. We take full control of memory in this inline assembly
            // block because it will not return to Solidity code. We overwrite the
            // Solidity scratch pad at memory position 0.

            // calldatacopy(t, f, s) - copy s bytes from calldata at position f to mem at position t
            // calldatasize() - size of call data in bytes
            calldatacopy(0, 0, calldatasize())

            // Call the implementation.
            // out and outsize are 0 because we don't know the size yet.

            // delegatecall(g, a, in, insize, out, outsize) -
            // - call contract at address a
            // - with input mem[in…(in+insize))
            // - providing g gas
            // - and output area mem[out…(out+outsize))
            // - returning 0 on error (eg. out of gas) and 1 on success
            let result := delegatecall(gas(), _implementation, 0, calldatasize(), 0, 0)

            // Copy the returned data.
            // returndatacopy(t, f, s) - copy s bytes from returndata at position f to mem at position t
            // returndatasize() - size of the last returndata
            returndatacopy(0, 0, returndatasize())

            switch result
            // delegatecall returns 0 on error.
            case 0 {
                // revert(p, s) - end execution, revert state changes, return data mem[p…(p+s))
                revert(0, returndatasize())
            }
            default {
                // return(p, s) - end execution, return data mem[p…(p+s))
                return(0, returndatasize())
            }
        }
    }

    function _fallback() private {
        _delegate(_getImplementation());
    }

    fallback() external payable {
        _fallback();
    }

    receive() external payable {
        _fallback();
    }
}
