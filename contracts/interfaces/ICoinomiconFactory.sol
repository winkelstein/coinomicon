// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface ICoinomiconFactory {
    function _getExchangeImplementation() external view returns (address);

    function _setExchangeImplementation(address implementation) external;

    function createExchange(address _ERC20ContractAddress, uint256 _startingPrice) external returns (address);

    function getExchange(address _ERC20ContractAddress) external view returns (address);

    event ExchangeCreated(address indexed _exchange, address indexed _token);
}
