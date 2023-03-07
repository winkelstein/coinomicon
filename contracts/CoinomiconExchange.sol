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
    }

    function getOrderCount() external view override returns (uint256) {
        return orderBook.length;
    }

    function getOrder(uint256 orderId) external view override returns (Order memory) {
        return orderBook[orderId];
    }

    function submitMarketOrder(uint256 amount, bool buy) external payable override returns (bool) {
        require(amount > 0, "Amount must be greater than zero");

        if (buy) {
            uint256 totalCost = 0;
            uint256 remainingAmount = amount;

            for (uint256 i = 0; i < orderBook.length && remainingAmount > 0; i++) {
                if (orderBook[i].active && !orderBook[i].buy && orderBook[i].isLimit) {
                    uint256 availableAmount = orderBook[i].amount;
                    uint256 availableCost = orderBook[i].price * availableAmount;

                    if (availableAmount >= remainingAmount) {
                        totalCost += remainingAmount * orderBook[i].price;
                        availableAmount -= remainingAmount;
                        remainingAmount = 0;
                        orderBook[i].amount = availableAmount;
                    } else {
                        totalCost += availableCost;
                        remainingAmount -= availableAmount;
                        orderBook[i].active = false;
                    }
                }
            }

            if (remainingAmount > 0) {
                orderBook.push(
                    Order(msg.sender, 0, remainingAmount, block.timestamp, buy, true, false)
                );
                emit MarketOrderSubmitted(orderBook.length - 1, msg.sender, remainingAmount, buy);
            }

            require(totalCost <= msg.value, "Insufficient ETH");

            if (totalCost < msg.value) {
                payable(msg.sender).transfer(msg.value.sub(totalCost));
            }

            IERC20(token).transfer(msg.sender, amount);
        } else {
            uint256 totalAmount = 0;
            uint256 remainingCost = msg.value;
            uint256 remainingEther = msg.value;

            for (uint256 i = 0; i < orderBook.length && remainingCost > 0; i++) {
                if (orderBook[i].active && orderBook[i].buy && orderBook[i].isLimit) {
                    uint256 availableAmount = orderBook[i].amount;
                    uint256 availableCost = orderBook[i].price * availableAmount;

                    if (availableCost <= remainingCost) {
                        totalAmount += availableAmount;
                        remainingCost -= availableCost;
                        orderBook[i].active = false;
                        if (!payable(orderBook[i].trader).send(availableCost)) {
                            remainingEther = remainingEther.add(availableCost);
                        }
                    } else {
                        uint256 availableAmountForCost = remainingCost / orderBook[i].price;
                        totalAmount += availableAmountForCost;
                        remainingCost = 0;
                        orderBook[i].amount = availableAmount - availableAmountForCost;
                        if (!payable(orderBook[i].trader).send(remainingCost)) {
                            remainingEther = remainingEther.add(remainingCost);
                        }
                    }
                }
            }

            if (remainingCost > 0) {
                orderBook.push(
                    Order(
                        msg.sender,
                        remainingCost.div(totalAmount),
                        totalAmount,
                        block.timestamp,
                        buy,
                        true,
                        false
                    )
                );
                emit MarketOrderSubmitted(orderBook.length - 1, msg.sender, totalAmount, buy);
            }

            require(totalAmount > 0, "Order book is empty");
            require(remainingEther == msg.value, "Error in transaction");

            IERC20(token).transferFrom(msg.sender, address(this), totalAmount);
        }

        return true;
    }
}
