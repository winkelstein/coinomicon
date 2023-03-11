// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./interfaces/ICoinomiconFactory.sol";
import "./CoinomiconExchange.sol";

/// @title Coinomicon Factory
/// @author treug0lnik041
/// @notice This contract should manage exchanges
contract CoinomiconFactory is ICoinomiconFactory {
    mapping(address => address) private exchanges;

    /// @notice creates new exchange and pushes it to exchanges mapping
    /// @param _token Token address
    /// @dev this function is really gas expensive because it is deploys new contract (Exchange contract)
    function createExchange(address _token) external returns (address) {
        require(_token != address(0), "Invalid token address");
        require(exchanges[_token] == address(0), "Exchange already exists");
        CoinomiconExchange newExchange = new CoinomiconExchange(_token);
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
