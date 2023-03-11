// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./interfaces/ICoinomiconExchange.sol";

/// @title Coinomicon Exchange
/// @author treug0lnik041
/// @notice Should only be deployed by Factory contract
contract CoinomiconExchange is ICoinomiconExchange {
    using SafeMath for uint256;

    address public token;
    Order[] public orderBook;

    constructor(address _token) {
        require(_token != address(0), "Invalid token address");
        require(msg.sender != tx.origin, "Contract could be deployed only from factory contract");
        token = _token;
    }

    /// @notice gets order book length
    function getOrderCount() external view override returns (uint256) {
        return orderBook.length;
    }

    /// @notice gets an order buy orderId
    /// @param orderId is an index in order book array
    function getOrder(uint256 orderId) external view override returns (Order memory) {
        return orderBook[orderId];
    }

    /// @notice submit limit order
    /// @param amount Amount tokens you want to buy or sell
    /// @param price Limited price
    /// @param buy Boolean argument. True - order is a buy order; false - order is a sell order
    /// @dev creates a new order only
    function submitLimitOrder(
        uint256 amount,
        uint256 price,
        bool buy
    ) external payable override returns (bool) {
        require(amount > 0, "Amount must be greater than zero");

        uint256 cost = amount.mul(price);
        if (buy) {
            require(cost <= msg.value, "Insufficient ETH");
        } else {
            require(
                IERC20(token).transferFrom(msg.sender, address(this), amount),
                "Error transferring tokens"
            );
        }

        orderBook.push(Order(msg.sender, price, amount, block.timestamp, buy, true, true));
        emit LimitOrderSubmitted(orderBook.length - 1, msg.sender, price, amount, buy);

        return true;
    }

    /// @notice submits market order
    /// @param amount Amount of tokens you want to buy or sell
    /// @param buy Boolean argument. True - order is a buy order; false - order is a sell order
    /// @dev processing market order to close order you've been submitted by using this function
    function submitMarketOrder(uint256 amount, bool buy) external payable override returns (bool) {
        require(amount > 0, "Amount must be greater than zero");
        orderBook.push(Order(msg.sender, 0, amount, block.timestamp, buy, true, false));
        emit MarketOrderSubmitted(orderBook.length - 1, msg.sender, amount, buy);
        Order storage myOrder = orderBook[orderBook.length - 1];

        if (buy) {
            uint256 totalCost = 0;

            for (uint256 i = 0; i < orderBook.length && myOrder.amount > 0; i++) {
                Order storage order = orderBook[i];
                if (order.active && !order.buy && order.isLimit) {
                    uint256 availableAmount = order.amount;
                    uint256 availableCost = order.price.mul(availableAmount);

                    if (availableAmount >= myOrder.amount) {
                        require(
                            payable(order.trader).send(myOrder.amount.mul(order.price)),
                            "Unable to send ether to the trader"
                        );
                        totalCost = totalCost.add(myOrder.amount.mul(order.price));
                        availableAmount = availableAmount.sub(myOrder.amount);
                        myOrder.amount = 0;
                        order.amount = availableAmount;
                    } else {
                        require(
                            payable(order.trader).send(availableCost),
                            "Unable to send ether to the trader"
                        );
                        totalCost = totalCost.add(availableCost);
                        myOrder.amount = myOrder.amount.sub(availableAmount);
                        order.active = false;
                        emit LimitOrderClosed(i, order.trader, order.price, order.buy);
                    }
                }
            }

            if (myOrder.amount == 0) {
                myOrder.active = false;
                emit MarketOrderClosed(orderBook.length - 1, myOrder.trader, myOrder.buy);
            }

            IERC20(token).transfer(msg.sender, amount.sub(myOrder.amount));
        } else {
            require(msg.value == 0, "You cannot send ether if you want to sell tokens");
            require(
                IERC20(token).transferFrom(msg.sender, address(this), amount),
                "Unable to transfer tokens to the exchange"
            );
            uint256 lastPrice = 1;
            uint256 totalAmount = 0;
            //uint256 remainingAmount = amount;
            uint256 totalCost = 0;

            for (uint256 i = 0; i < orderBook.length && myOrder.amount > 0; i++) {
                Order storage order = orderBook[i];
                if (order.active && order.buy && order.isLimit) {
                    uint256 availableAmount = order.amount;
                    uint256 availableCost = order.price.mul(availableAmount);

                    if (availableAmount >= myOrder.amount) {
                        IERC20(token).transfer(order.trader, myOrder.amount);
                        totalCost = totalCost.add(myOrder.amount.mul(order.price));
                        totalAmount = totalAmount.add(myOrder.amount);
                        availableAmount = availableAmount.sub(myOrder.amount);
                        myOrder.amount = 0;
                        order.amount = availableAmount;
                    } else {
                        IERC20(token).transfer(order.trader, availableAmount);
                        totalCost = totalCost.add(availableCost);
                        totalAmount = totalAmount.add(availableAmount);
                        myOrder.amount = myOrder.amount.sub(availableAmount);
                        order.active = false;
                        emit LimitOrderClosed(i, order.trader, order.price, order.buy);
                        lastPrice = order.price;
                    }
                }
            }

            if (myOrder.amount == 0) {
                myOrder.active = false;
                emit MarketOrderClosed(orderBook.length - 1, myOrder.trader, myOrder.buy);
            }

            require(payable(msg.sender).send(totalCost), "Unable to pay ether to the sellet");
        }

        return true;
    }

    /// @notice close order
    /// @param orderId An index in order book array
    /// @dev completely deletes the order to prevent the creation of low or high price orders that could potentially affect the price
    function cancelOrder(uint256 orderId) external override returns (bool) {
        Order storage order = orderBook[orderId];
        require(msg.sender == order.trader, "You can only cancel your own orders.");
        require(order.active, "Order is already inactive.");

        if (order.buy) {
            require(
                payable(order.trader).send(order.amount.mul(order.price)),
                "Unable to return ether"
            );
        } else {
            require(IERC20(token).transfer(order.trader, order.amount), "Unable to return tokens");
        }

        delete orderBook[orderId];
        emit OrderCancelled(orderId, msg.sender);
        return true;
    }
}
