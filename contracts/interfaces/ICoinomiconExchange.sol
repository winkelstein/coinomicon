// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface ICoinomiconExchange {
    function token() external view returns (address);

    function buyLimit(uint256 _amount, uint256 _limitPrice)
        external
        payable
        returns (uint256);

    function sellLimit(uint256 _amount, uint256 _limitPrice)
        external
        returns (uint256);

    function buyMarket(uint256 _amount) external payable;

    function sellMarket(uint256 _amount) external;

    function decline(uint256 _orderId) external;

    event BuyOrderCreated(
        uint256 indexed _orderId,
        uint256 _amount,
        uint256 _limitPrice
    );
    event SellOrderCreated(
        uint256 indexed _orderId,
        uint256 _amount,
        uint256 _limitPrice
    );

    event BuyOrderClosed(
        uint256 indexed _orderId,
        uint256 _amount,
        uint256 _limitPrice
    );
    event SellOrderClosed(
        uint256 indexed _orderId,
        uint256 _amount,
        uint256 _limitPrice
    );

    event OrderDeclined(uint256 indexed _orderId);
}
