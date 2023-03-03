// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract TestToken is ERC20 {
	constructor(uint256 _firstMinted) ERC20("Token for Coinomicon tests", "TTC") {
		_mint(msg.sender, _firstMinted);
	}
}