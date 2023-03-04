// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./interfaces/ICoinomiconFactory.sol";
import "./CoinomiconExchange.sol";

contract CoinomiconFactory is ICoinomiconFactory {
    mapping(address => address) private exchanges;

    function createExchange(address _token) external returns (address) {
        require(_token != address(0), "Invalid token address");
        require(exchanges[_token] == address(0), "Exchange already exists");
        CoinomiconExchange newExchange = new CoinomiconExchange(_token);
        exchanges[_token] = address(newExchange);
        emit ExchangeCreated(address(newExchange), _token);
        return address(newExchange);
    }

    function getExchange(address _tokenAddress)
        external
        view
        returns (address)
    {
        return exchanges[_tokenAddress];
    }
}
