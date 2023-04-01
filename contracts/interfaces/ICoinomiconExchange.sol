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

    function getOrderCount() external view returns (uint256);

    function getOrder(uint256 orderId) external view returns (Order memory);

    function cost(
        uint256 amount,
        uint256 price,
        bool isLimit,
        bool buy
    ) external view returns (uint256 available, uint256 totalCost);

    function bestPrice() external view returns (uint256);

    function submitLimitOrder(
        uint256 amount,
        uint256 price,
        bool buy
    ) external payable returns (bool);

    function submitMarketOrder(uint256 amount, bool buy) external payable returns (bool);

    function cancelOrder(uint256 orderId) external returns (bool);

    event LimitOrderSubmitted(
        uint256 indexed orderId,
        address trader,
        uint256 amount,
        uint256 price,
        bool buy
    );
    event MarketOrderSubmitted(uint256 indexed orderId, address trader, uint256 amount, bool buy);
    event LimitOrderClosed(uint256 indexed orderId, address trader, uint256 price, bool buy);
    event MarketOrderClosed(uint256 indexed orderId, address trader, uint256 price, bool buy);
    event OrderCancelled(uint256 indexed orderId, address trader);
}
