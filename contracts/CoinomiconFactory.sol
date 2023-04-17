// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ICoinomiconFactory.sol";
import "./CoinomiconExchangeImpl.sol";
import "./CoinomiconExchangeProxy.sol";

/// @title Coinomicon Factory
/// @author winkelstein
/// @notice This contract should manage exchanges
contract CoinomiconFactory is ICoinomiconFactory, Ownable {
    mapping(address => address) private exchanges;
    address private _exchangeImplementation;

    function _getExchangeImplementation() public view returns (address) {
        return _exchangeImplementation;
    }

    function _setExchangeImplementation(address implementation) external onlyOwner {
        require(implementation != address(0), "Invalid implementation");
        _exchangeImplementation = implementation;
    }

    /// @notice creates new exchange and pushes it to exchanges mapping
    /// @param _token Token address
    /// @dev this function is really gas expensive because it is deploys new contract (Exchange contract)
    function createExchange(address _token, uint256 startingPrice) external returns (address) {
        require(_getExchangeImplementation() != address(0), "Invalid implementation");
        require(_token != address(0), "Invalid token address");
        require(exchanges[_token] == address(0), "Exchange already exists");
        CoinomiconExchange newExchange = new CoinomiconExchange(_token, startingPrice);
        exchanges[_token] = address(newExchange);
        emit ExchangeCreated(address(newExchange), _token);
        return address(newExchange);
    }

    /// @notice gets exchange by token address
    /// @param _tokenAddress Token address
    function getExchange(address _tokenAddress) external view returns (address) {
        return exchanges[_tokenAddress];
    }
}
