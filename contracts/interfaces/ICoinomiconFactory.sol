// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface ICoinomiconFactory {
    function createExchange(address _ERC20ContractAddress)
        external
        returns (address);

    function getExchange(address _ERC20ContractAddress)
        external
        view
        returns (address);

    event ExchangeCreated(address indexed _exchange, address indexed _token);
}
