// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./interfaces/ICoinomiconExchange.sol";

contract CoinomiconExchange is ICoinomiconExchange {
    using SafeMath for uint256;

    address public token;
    address public factoryAddress;

    Order[] public orderBook;

    constructor(address _token) {
        require(_token != address(0), "Invalid token address");
        require(msg.sender != tx.origin, "Contract could be deployed only from factory contract");
        token = _token;
        factoryAddress = msg.sender;
    }

    function getOrderCount() external view override returns (uint256) {
        return orderBook.length;
    }

    function getOrder(uint256 orderId) external view override returns (Order memory) {
        return orderBook[orderId];
    }

    function submitLimitOrder(
        uint256 price,
        uint256 amount,
        bool buy
    ) external payable override returns (bool) {
        require(amount > 0, "Amount must be greater than zero");

        uint256 cost = amount * price;
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

    function submitMarketOrder(uint256 amount, bool buy) external payable override returns (bool) {
        require(amount > 0, "Amount must be greater than zero");

        if (buy) {
            uint256 lastPrice = 1;

            uint256 totalCost = 0;
            uint256 remainingAmount = amount;

            for (uint256 i = 0; i < orderBook.length && remainingAmount > 0; i++) {
                Order memory order = orderBook[i];
                if (order.active && !order.buy && order.isLimit) {
                    uint256 availableAmount = order.amount;
                    uint256 availableCost = order.price * availableAmount;

                    if (availableAmount >= remainingAmount) {
                        require(
                            payable(order.trader).send(remainingAmount * order.price),
                            "Unable to send ether to the trader"
                        );
                        totalCost += remainingAmount * order.price;
                        availableAmount -= remainingAmount;
                        remainingAmount = 0;
                        order.amount = availableAmount;
                    } else {
                        require(
                            payable(order.trader).send(availableCost),
                            "Unable to send ether to the trader"
                        );
                        totalCost += availableCost;
                        remainingAmount -= availableAmount;
                        order.active = false;
                        lastPrice = order.price;
                    }
                }
            }

            if (remainingAmount > 0) {
                orderBook.push(
                    Order(msg.sender, lastPrice, remainingAmount, block.timestamp, buy, true, false)
                );
                emit MarketOrderSubmitted(orderBook.length - 1, msg.sender, remainingAmount, buy);
            }

            /*if (totalCost <= msg.value) {
                require(
                    payable(msg.sender).send(msg.value.sub(totalCost)),
                    "Unable to return ether left to the sender"
                );
            }*/

            IERC20(token).transfer(msg.sender, amount.sub(remainingAmount));
        } else {
            require(msg.value == 0, "You cannot send ether if you want to sell tokens");
            require(
                IERC20(token).transferFrom(msg.sender, address(this), amount),
                "Unable to transfer tokens to the exchange"
            );
            uint256 lastPrice = 1;
            uint256 totalAmount = 0;
            uint256 remainingAmount = amount;

            for (uint256 i = 0; i < orderBook.length && remainingAmount > 0; i++) {
                Order memory order = orderBook[i];
                if (order.active && order.buy && order.isLimit) {
                    uint256 availableAmount = order.amount;
                    uint256 availableCost = order.price * availableAmount;

                    if (availableAmount >= remainingAmount) {
                        require(
                            payable(msg.sender).send(remainingAmount * order.price),
                            "Unable send ether to the sender"
                        );
                        IERC20(token).transfer(order.trader, remainingAmount);
                        totalAmount += remainingAmount;
                        availableAmount -= remainingAmount;
                        remainingAmount = 0;
                        order.amount = availableAmount;
                    } else {
                        require(
                            payable(msg.sender).send(availableAmount * order.price),
                            "Unable send ether to the sender"
                        );
                        IERC20(token).transfer(order.trader, availableAmount);
                        totalAmount += availableAmount;
                        remainingAmount -= availableAmount;
                        order.active = false;
                        lastPrice = order.price;
                    }
                }
            }

            if (remainingAmount > 0) {
                orderBook.push(
                    Order(msg.sender, lastPrice, remainingAmount, block.timestamp, buy, true, false)
                );
                emit MarketOrderSubmitted(orderBook.length - 1, msg.sender, remainingAmount, buy);
            }
        }

        return true;
    }

    function cancelOrder(uint256 orderId) external override returns (bool) {
        Order storage order = orderBook[orderId];
        require(msg.sender == order.trader, "You can only cancel your own orders.");
        require(order.active, "Order is already inactive.");

        if (order.buy) {
            require(
                payable(order.trader).send(order.amount * order.price),
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
