// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface ICoinomiconExchange {
    struct Order {
        address trader;
        uint256 price;
        uint256 amount;
        uint256 date;
        bool buy;
        bool active;
        bool isLimit;
    }

    function submitLimitOrder(
        uint256 amount,
        uint256 price,
        bool buy
    ) external payable returns (bool);

    function submitMarketOrder(uint256 amount, bool buy) external payable returns (bool);

    function cancelOrder(uint256 orderId) external returns (bool);

    function getOrderCount() external view returns (uint256);

    function getOrder(uint256 orderId) external view returns (Order memory);

    event LimitOrderSubmitted(
        uint256 orderId,
        address trader,
        uint256 price,
        uint256 amount,
        bool buy
    );
    event MarketOrderSubmitted(uint256 orderId, address trader, uint256 amount, bool buy);
    event LimitOrderClosed(uint256 orderId, address trader, uint256 price, bool buy);
    event MarketOrderClosed(uint256 orderId, address trader, bool buy);
    event OrderCancelled(uint256 orderId, address trader);
}
