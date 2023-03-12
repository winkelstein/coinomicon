// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./interfaces/ICoinomiconExchange.sol";

/// @title Coinomicon Exchange
/// @author treug0lnik041
/// @notice Should only be deployed by Factory contract
contract CoinomiconExchangeImpl is ICoinomiconExchange {
    using SafeMath for uint256;

    address public token;
    address factory;
    Order[] public orderBook;

    /// @notice gets order book length
    function getOrderCount() external view override returns (uint256) {
        return orderBook.length;
    }

    /// @notice gets an order buy orderId
    /// @param orderId is an index in order book array
    function getOrder(uint256 orderId) external view override returns (Order memory) {
        return orderBook[orderId];
    }

    /// @notice get cost of buy or sell method
    /// @param amount Amount token you want to buy
    /// @param price Price per token. Could be 0 if isLimit is false
    /// @param isLimit is order you want to submit limited or not
    /// @param buy True if buy and false if sell
    /// @return available Available tokens on exchange. Not necessary if buy is false
    /// @return totalCost Cost you have to pay or you get if buy is false
    /// @dev returns cost only for available. It is recommended to buy market price only for available tokens
    function cost(
        uint256 amount,
        uint256 price,
        bool isLimit,
        bool buy
    ) external view returns (uint256 available, uint256 totalCost) {
        if (buy) {
            for (uint256 i = 0; i < orderBook.length && amount > 0; i++) {
                Order memory order = orderBook[i];
                if (order.active && !order.buy) {
                    // Buy
                    // Order is limited what means that we have to check compare limited prices
                    if (isLimit && order.price > price) continue;

                    uint256 availableAmount = order.amount;
                    uint256 availableCost = order.price.mul(availableAmount);

                    if (availableAmount >= amount) {
                        totalCost = totalCost.add(amount.mul(order.price));
                        availableAmount = availableAmount.sub(amount);
                        available = amount;
                        amount = 0;
                    } else {
                        totalCost = totalCost.add(availableCost);
                        amount = amount.sub(availableAmount);
                        available += availableAmount;
                    }
                }
            }
        } else {
            uint256 totalAmount = 0;

            for (uint256 i = 0; i < orderBook.length && amount > 0; i++) {
                Order storage order = orderBook[i];
                if (order.active && order.buy) {
                    // Order is limited what means that we have to check compare limited prices
                    if (order.price < price) continue;
                    uint256 availableAmount = order.amount;
                    uint256 availableCost = order.price.mul(availableAmount);

                    if (availableAmount >= amount) {
                        totalCost = totalCost.add(amount.mul(order.price));
                        totalAmount = totalAmount.add(amount);
                        availableAmount = availableAmount.sub(amount);
                        amount = 0;
                    } else {
                        totalCost = totalCost.add(availableCost);
                        totalAmount = totalAmount.add(availableAmount);
                        amount = amount.sub(availableAmount);
                    }
                }
            }
            available = totalAmount;
        }
    }

    /// @notice calculate best price
    /// @dev should be used for calculation remaining amount if market order cannot be closed by submitMarketOrder function
    function bestPrice() public view returns (uint256) {
        uint256 sum = 1;
        uint256 j = 1;

        for (uint i = 0; i < orderBook.length; i++) {
            if (!orderBook[i].active) {
                sum += orderBook[i].price;
                j++;
            }
        }

        return sum.div(j);
    }

    /// @notice submit limit order
    /// @param amount Amount tokens you want to buy or sell
    /// @param price Limited price
    /// @param buy Boolean argument. True - order is a buy order; false - order is a sell order
    /// @dev trying to close it created order by market and other limited orders
    function submitLimitOrder(
        uint256 amount,
        uint256 price,
        bool buy
    ) external payable override returns (bool) {
        require(amount > 0, "Amount must be greater than zero");

        if (buy) {
            require(amount.mul(price) <= msg.value, "Insufficient ETH");
        }

        orderBook.push(Order(msg.sender, price, amount, block.timestamp, buy, true, true));
        emit LimitOrderSubmitted(orderBook.length - 1, msg.sender, amount, price, buy);

        Order storage myOrder = orderBook[orderBook.length - 1];

        if (buy) {
            uint256 totalCost = 0;

            for (uint256 i = 0; i < orderBook.length && myOrder.amount > 0; i++) {
                Order storage order = orderBook[i];
                if (order.active && !order.buy) {
                    // Buy
                    // Order is limited what means that we have to check compare limited prices
                    if (order.price > myOrder.price) continue;

                    uint256 availableAmount = order.amount;
                    uint256 availableCost = order.price.mul(availableAmount);
                    uint256 expectedCost = availableAmount >= myOrder.amount
                        ? myOrder.amount * myOrder.price
                        : order.amount * myOrder.price;

                    if (availableAmount >= myOrder.amount) {
                        require(
                            payable(order.trader).send(myOrder.amount.mul(order.price)),
                            "Unable to send ether to the trader"
                        );
                        totalCost = totalCost.add(myOrder.amount.mul(order.price));
                        availableAmount = availableAmount.sub(myOrder.amount);
                        myOrder.amount = 0;
                        order.amount = availableAmount;
                        myOrder.active = false;
                        emit LimitOrderClosed(
                            orderBook.length - 1,
                            myOrder.trader,
                            myOrder.price,
                            myOrder.buy
                        );
                    } else {
                        require(
                            payable(order.trader).send(availableCost),
                            "Unable to send ether to the trader"
                        );
                        totalCost = totalCost.add(availableCost);
                        myOrder.amount = myOrder.amount.sub(availableAmount);
                        order.active = false;
                        if (order.isLimit)
                            emit LimitOrderClosed(i, order.trader, order.price, order.buy);
                        else emit MarketOrderClosed(i, order.trader, order.price, order.buy);
                    }

                    require(
                        payable(msg.sender).send(expectedCost - availableCost),
                        "Unable to return ether to the sender"
                    );
                }
            }
            IERC20(token).transfer(msg.sender, amount.sub(myOrder.amount));
        } else {
            require(msg.value == 0, "You cannot send ether if you want to sell tokens");
            IERC20(token).transferFrom(msg.sender, address(this), amount);
            uint256 totalAmount = 0;
            uint256 totalCost = 0;

            for (uint256 i = 0; i < orderBook.length && myOrder.amount > 0; i++) {
                Order storage order = orderBook[i];
                if (order.active && order.buy) {
                    // Order is limited what means that we have to check compare limited prices
                    if (order.price < myOrder.price) continue;
                    uint256 availableAmount = order.amount;
                    uint256 availableCost = order.price.mul(availableAmount);

                    if (availableAmount >= myOrder.amount) {
                        IERC20(token).transfer(order.trader, myOrder.amount);
                        totalCost = totalCost.add(myOrder.amount.mul(order.price));
                        totalAmount = totalAmount.add(myOrder.amount);
                        availableAmount = availableAmount.sub(myOrder.amount);
                        myOrder.amount = 0;
                        order.amount = availableAmount;
                        myOrder.active = false;
                        emit LimitOrderClosed(
                            orderBook.length - 1,
                            myOrder.trader,
                            myOrder.price,
                            myOrder.buy
                        );
                    } else {
                        IERC20(token).transfer(order.trader, availableAmount);
                        totalCost = totalCost.add(availableCost);
                        totalAmount = totalAmount.add(availableAmount);
                        myOrder.amount = myOrder.amount.sub(availableAmount);
                        order.active = false;
                        if (order.isLimit)
                            emit LimitOrderClosed(i, order.trader, order.price, order.buy);
                        else emit MarketOrderClosed(i, order.trader, order.price, order.buy);
                    }
                }
            }

            if (totalCost > 0)
                require(payable(msg.sender).send(totalCost), "Unable to pay ether to the seller");
        }

        return true;
    }

    /// @notice submits market order
    /// @param amount Amount of tokens you want to buy or sell
    /// @param buy Boolean argument. True - order is a buy order; false - order is a sell order
    /// @dev trying to close created order by limited orders
    function submitMarketOrder(uint256 amount, bool buy) external payable override returns (bool) {
        require(amount > 0, "Amount must be greater than zero");
        orderBook.push(Order(msg.sender, bestPrice(), amount, block.timestamp, buy, true, false));
        emit MarketOrderSubmitted(orderBook.length - 1, msg.sender, amount, buy);
        Order storage myOrder = orderBook[orderBook.length - 1];

        if (buy) {
            uint256 totalCost = 0;

            for (uint256 i = 0; i < orderBook.length && myOrder.amount > 0; i++) {
                Order storage order = orderBook[i];
                if (order.active && !order.buy) {
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
                        if (order.isLimit)
                            emit LimitOrderClosed(i, order.trader, order.price, order.buy);
                        else emit MarketOrderClosed(i, order.trader, order.price, order.buy);
                    }
                }
            }
            require(
                msg.value.sub(totalCost) >= myOrder.price * myOrder.amount,
                "Not enough ether to create new market order"
            );
            if (myOrder.amount == 0) {
                myOrder.active = false;
                emit MarketOrderClosed(
                    orderBook.length - 1,
                    myOrder.trader,
                    myOrder.price,
                    myOrder.buy
                );
            }

            IERC20(token).transfer(msg.sender, amount.sub(myOrder.amount));
        } else {
            require(msg.value == 0, "You cannot send ether if you want to sell tokens");
            IERC20(token).transferFrom(msg.sender, address(this), amount);
            uint256 totalAmount = 0;
            uint256 totalCost = 0;

            for (uint256 i = 0; i < orderBook.length && myOrder.amount > 0; i++) {
                Order storage order = orderBook[i];
                if (order.active && order.buy) {
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
                        if (order.isLimit)
                            emit LimitOrderClosed(i, order.trader, order.price, order.buy);
                        else emit MarketOrderClosed(i, order.trader, order.price, order.buy);
                    }
                }
            }

            if (myOrder.amount == 0) {
                myOrder.active = false;
                emit MarketOrderClosed(
                    orderBook.length - 1,
                    myOrder.trader,
                    myOrder.price,
                    myOrder.buy
                );
            }

            require(payable(msg.sender).send(totalCost), "Unable to pay ether to the seller");
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
