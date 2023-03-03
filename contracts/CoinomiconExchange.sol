// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import "./interfaces/ICoinomiconExchange.sol";

contract CoinomiconExchange is ICoinomiconExchange {
	address private tokenAddress;
	address private factoryAddress;

	enum OrderType {
		Sell,
		Buy
	}

	struct Order {
		address creator;
		OrderType orderType;
		uint256 amount;
		uint256 price;
		bool closed;
	}

	Order[] public orderBook;

    constructor(address _tokenAddress) {
		require(_tokenAddress != address(0), "Invalid token address");
		require(msg.sender != tx.origin, "Contract could be deployed only from factory contract");
		tokenAddress = _tokenAddress;
		factoryAddress = msg.sender;
	}

	function token() external view returns (address) {
		return tokenAddress;
	}

	function _limitOrderPrice(uint256 _limitPrice) internal view returns (uint256[] memory) {
		uint256 length;
		for (uint256 i = 0; i < orderBook.length; i++) {
			if (orderBook[i].closed == false && orderBook[i].price <= _limitPrice) {
				length++;
			}
		}
		uint256[] memory orderIds = new uint256[](length);

		for (uint256 i = 0; length > 0; i++) {
			if (orderBook[i].closed == false && orderBook[i].price <= _limitPrice) {
				orderIds[length - (1 - length)] = i;
			}
		}

		return orderIds;
	}

	function marketSellPrice(uint256 _amount) public view returns (uint256 _available, uint256 _paymentAmount) {
		return _marketSellPrice(_amount); 
	}

	function limitSellPrice(uint256 _amount, uint256 _limitPrice) public view returns (uint256 _available, uint256 _paymentAmount) {
		return _limitSellPrice(_amount, _limitPrice);
	}

	function marketBuyPrice(uint256 _amount) public view returns (uint256 _available, uint256 _paymentAmount) {
		return _marketBuyPrice(_amount);
	}

	function limitBuyPrice(uint256 _amount, uint256 _limitPrice) public view returns (uint256 _available, uint256 _paymentAmount) {
		return _limitBuyPrice(_amount, _limitPrice);
	}

	function buyLimit(uint256 _amount, uint256 _limitPrice) external payable returns (uint256) {
		require(_amount * _limitPrice == msg.value, "Insufficient balance");
		return _createBuyOrder(_amount, _limitPrice, msg.sender);
	}

	function sellLimit(uint256 _amount, uint256 _limitPrice) external returns (uint256) {
		require(IERC20(tokenAddress).balanceOf(msg.sender) >= _amount, "Insufficient balance");
		require(IERC20(tokenAddress).allowance(msg.sender, address(this)) >= _amount, "Allowance less than specified amount");
		require(IERC20(tokenAddress).transferFrom(msg.sender, address(this), _amount), "Unable to process transferring tokens");
		return _createSellOrder(_amount, _limitPrice, msg.sender);
	}

	function buyMarket(uint256 _amount) external payable {
		(uint256 _available, uint256 _paymentAmount) = _marketSellPrice(_amount);
		require(msg.value == _paymentAmount, "Given ether value is not equal to requested payment amount");
		// Take price of already closed order
		uint256 lastPriceOnMarket = orderBook[orderBook.length - 1].price;
		uint myOrderId = _createBuyOrder(_amount, lastPriceOnMarket, msg.sender);
		Order storage myOrder = orderBook[myOrderId];
		require(_available >= myOrder.amount, "The amount exceeds the available funds. Instead, create a buy order via buyLimit contract method");

		for (uint256 i = 0; i < orderBook.length && myOrder.amount > 0; i++) {
			if (orderBook[i].closed == false && orderBook[i].orderType == OrderType.Sell) {
				Order storage order = orderBook[i];
				if (order.amount > myOrder.amount) {
					order.amount -= myOrder.amount;
					myOrder.closed = true;
					_paySeller(payable(order.creator), myOrder.amount * order.price);
					_payBuyer(msg.sender, myOrder.amount);
					emit BuyOrderClosed(myOrderId, myOrder.amount, 0);
					return;
				} else if (order.amount < myOrder.amount) {
					myOrder.amount -= order.amount;
					order.closed = true;
					if (!_paySeller(payable(order.creator), order.amount * order.price)) revert("Unable to pay seller");
					if (!_payBuyer(msg.sender, order.amount)) revert("Unable to pay buyer");

					emit SellOrderClosed(i, order.amount, order.price);
				} else if (order.amount == myOrder.amount) {
					order.closed = true;
					myOrder.closed = true;
					if (!_paySeller(payable(order.creator), order.amount * order.price)) revert("Unable to pay seller");
					if (!_payBuyer(msg.sender, myOrder.amount)) revert("Unable to pay buyer");

					order.amount = 0;
					myOrder.amount = 0;

					emit SellOrderClosed(i, _amount, order.price);
					emit BuyOrderClosed(myOrderId, _amount, order.price);
					return;
				}
			}
		}
	}

	function sellMarket(uint256 _amount) external {
		revert("Not implemented");
	}

	function decline(uint256 _orderId) external {
		Order storage order = orderBook[_orderId];
		require(order.closed == false, "Order is already closed");
		require(order.creator == msg.sender, "You can decline only your order");
		if (order.orderType == OrderType.Sell) {
			IERC20(tokenAddress).transfer(order.creator, order.amount);
		} else {
			payable(order.creator).transfer(order.amount);
		}
		delete orderBook[_orderId];
		
		emit OrderDeclined(_orderId);
	}

	function _createSellOrder(uint256 _amount, uint256 _price, address _sender) internal returns (uint256) {
		Order memory newOrder = Order(_sender, OrderType.Sell, _amount, _price, false);
		orderBook.push(newOrder);
		emit SellOrderCreated(orderBook.length - 1, _amount, _price);
		return orderBook.length - 1;
	}

	function _createBuyOrder(uint256 _amount, uint256 _price, address _sender) internal returns (uint256 _orderId) {
		Order memory newOrder = Order(_sender, OrderType.Sell, _amount, _price, false);
		orderBook.push(newOrder);
		emit BuyOrderCreated(orderBook.length - 1, _amount, _price);
		return orderBook.length - 1;
	}

	function _marketSellPrice(uint256 _amount) public view returns (uint256 _available, uint256 _paymentAmount) {
		for (uint256 i = 0; i < orderBook.length && _available <= _amount; i++) {
			if (orderBook[i].closed == false && orderBook[i].orderType == OrderType.Sell) {
				_available += orderBook[i].amount;
				_paymentAmount += orderBook[i].amount * orderBook[i].price;
			}
		}

		return (_available, _paymentAmount);
	}

	function _limitSellPrice(uint256 _amount, uint256 _limitPrice) public view returns (uint256 _available, uint256 _paymentAmount) {
		for (uint256 i = 0; i < orderBook.length && _available <= _amount; i++) {
			if (orderBook[i].closed == false && orderBook[i].price <= _limitPrice && orderBook[i].orderType == OrderType.Sell) {
				_available += orderBook[i].amount;
				_paymentAmount += orderBook[i].amount * orderBook[i].price;
			}
		}

		return (_available, _paymentAmount);
	}

	function _marketBuyPrice(uint256 _amount) internal view returns (uint256 _available, uint256 _paymentAmount) {
		for (uint256 i = 0; i < orderBook.length && _available <= _amount; i++) {
			if (orderBook[i].closed == false && orderBook[i].orderType == OrderType.Buy) {
				_available += orderBook[i].amount;
				_paymentAmount += orderBook[i].amount * orderBook[i].price;
			}
		}

		return (_available, _paymentAmount);
	}

	function _limitBuyPrice(uint256 _amount, uint256 _limitPrice) internal view returns (uint256 _available, uint256 _paymentAmount) {
		for (uint256 i = 0; i < orderBook.length && _available <= _amount; i++) {
			if (orderBook[i].closed == false && orderBook[i].price <= _limitPrice && orderBook[i].orderType == OrderType.Buy) {
				_available += orderBook[i].amount;
				_paymentAmount += orderBook[i].amount * orderBook[i].price;
			}
		}

		return (_available, _paymentAmount);
	}
	

	function _paySeller(address payable _to, uint256 _amount) internal returns (bool) {
		require(address(this).balance >= _amount, "Insufficient exchange ether balance");
		return _to.send(_amount);
	}

	function _payBuyer(address _to, uint256 _amount) internal returns (bool) {
		require(IERC20(tokenAddress).balanceOf(address(this)) >= _amount, "Insufficient exchange token balance");
		return IERC20(tokenAddress).transfer(_to, _amount);
	}
}