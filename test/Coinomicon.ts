import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Coinomicon", function () {
    async function deployFixture() {
        const [owner, account1, account2] = await ethers.getSigners();

        const Coinomicon = await ethers.getContractFactory("CoinomiconFactory");
        const coinomicon = await Coinomicon.deploy();

        const CoinomiconExchangeImpl = await ethers.getContractFactory("CoinomiconExchangeImpl");
        const coinomiconExchangeImpl = await CoinomiconExchangeImpl.deploy();

        await coinomicon._setExchangeImplementation(coinomiconExchangeImpl.address);

        return { coinomicon, owner, account1, account2 };
    }

    async function createExchangeFixture() {
        const { coinomicon, owner, account1, account2 } = await deployFixture();

        const Token = await ethers.getContractFactory("TestToken");
        const token = await Token.deploy("3000000000000");

        const ExchangeContract = await ethers.getContractFactory("CoinomiconExchangeImpl");
        await coinomicon.createExchange(token.address, 1);
        const exchangeAddress = await coinomicon.getExchange(token.address);
        const exchange = await ExchangeContract.attach(exchangeAddress);

        return { coinomicon, exchange, token, owner, account1, account2 };
    }

    async function equalTokenBalanceFixture() {
        const { coinomicon, exchange, token, owner, account1, account2 } =
            await createExchangeFixture();

        await token.transfer(account1.address, "1000000000000");
        await token.transfer(account2.address, "1000000000000");

        return { coinomicon, exchange, token, owner, account1, account2 };
    }

    describe("Deployment", function () {
        it("Deploy and create new exchange", async function () {
            const { coinomicon, owner, account1, account2 } = await loadFixture(deployFixture);

            const Token = await ethers.getContractFactory("TestToken");
            const token = await Token.deploy("1000000000");

            await expect(coinomicon.createExchange(token.address, 1)).to.emit(
                coinomicon,
                "ExchangeCreated"
            );
        });

        it("Get created exchange address", async function () {
            const { coinomicon, owner, account1, account2 } = await loadFixture(deployFixture);

            const Token = await ethers.getContractFactory("TestToken");
            const token = await Token.deploy("1000000000");

            await coinomicon.createExchange(token.address, 1);

            const ExchangeContract = await ethers.getContractFactory("CoinomiconExchangeImpl");
            const exchangeAddress = await coinomicon.getExchange(token.address);
            const exchange = await ExchangeContract.attach(exchangeAddress);

            expect(await exchange.token()).to.equal(token.address);
        });

        it("Should revert", async function () {
            const { coinomicon, owner, account1, account2 } = await loadFixture(deployFixture);

            const Token = await ethers.getContractFactory("TestToken");
            const token = await Token.deploy("1000000000");

            await coinomicon.createExchange(token.address, 1);

            await expect(coinomicon.createExchange(token.address, 1)).to.be.revertedWith(
                "Exchange already exists"
            );
            await expect(
                coinomicon.createExchange(ethers.constants.AddressZero, 1)
            ).to.be.revertedWith("Invalid token address");
        });
    });

    describe("Proxy", function () {
        it("Upgrade", async function () {
            const { coinomicon, exchange, token, owner, account1, account2 } = await loadFixture(
                createExchangeFixture
            );

            const CoinomiconExchangeImpl = await ethers.getContractFactory(
                "CoinomiconExchangeImpl"
            );
            const coinomiconExchangeImpl = await CoinomiconExchangeImpl.deploy();

            await coinomicon._setExchangeImplementation(coinomiconExchangeImpl.address);

            expect(await coinomicon._getExchangeImplementation()).to.equal(
                coinomiconExchangeImpl.address
            );
        });

        describe("Should revert", function () {
            it("Set address of 0 implementation", async function () {
                const { coinomicon, exchange, token, owner, account1, account2 } =
                    await loadFixture(createExchangeFixture);

                await expect(
                    coinomicon._setExchangeImplementation(ethers.constants.AddressZero)
                ).to.revertedWith("Invalid implementation");
            });

            it("Implementation hasn't been set", async function () {
                const [owner, account1, account2] = await ethers.getSigners();

                const Coinomicon = await ethers.getContractFactory("CoinomiconFactory");
                const coinomicon = await Coinomicon.deploy();

                const _Token = await ethers.getContractFactory("TestToken");
                const _token = await _Token.deploy(80000);

                await expect(coinomicon.createExchange(_token.address, 1)).to.revertedWith(
                    "Invalid implementation"
                );
            });

            it("Only owner", async function () {
                const { coinomicon, exchange, token, owner, account1, account2 } =
                    await loadFixture(createExchangeFixture);

                const CoinomiconExchangeImpl = await ethers.getContractFactory(
                    "CoinomiconExchangeImpl"
                );
                const coinomiconExchangeImpl = await CoinomiconExchangeImpl.deploy();

                await expect(
                    coinomicon
                        .connect(account1)
                        ._setExchangeImplementation(coinomiconExchangeImpl.address)
                ).to.revertedWith("Ownable: caller is not the owner");
            });
        });
    });

    describe("Orders", function () {
        describe("Create orders", function () {
            it("Create sell limit orders", async function () {
                const { coinomicon, exchange, token, owner, account1, account2 } =
                    await loadFixture(createExchangeFixture);

                await token.approve(exchange.address, 1000);

                for (let i = 0; i < 10; i++) {
                    await exchange.submitLimitOrder(100, i * i, false);
                }

                expect(await exchange.getOrderCount()).to.equal(10);
                for (let i = 0; i < 10; i++) {
                    const order = await exchange.getOrder(i);
                    expect(order.trader).to.equal(owner.address);
                    expect(order.price).to.equal(i * i);
                    expect(order.amount).to.equal(100);
                    expect(order.buy).to.equal(false);
                    expect(order.active).to.equal(true);
                    expect(order.isLimit).to.equal(true);
                }
            });

            it("Create sell limit orders", async function () {
                const { coinomicon, exchange, token, owner, account1, account2 } =
                    await loadFixture(createExchangeFixture);

                for (let i = 0; i < 10; i++) {
                    await exchange.submitLimitOrder(100, i * i, true, { value: 100 * i * i });
                }

                expect(await exchange.getOrderCount()).to.equal(10);
                for (let i = 0; i < 10; i++) {
                    const order = await exchange.getOrder(i);
                    expect(order.trader).to.equal(owner.address);
                    expect(order.price).to.equal(i * i);
                    expect(order.amount).to.equal(100);
                    expect(order.buy).to.equal(true);
                    expect(order.active).to.equal(true);
                    expect(order.isLimit).to.equal(true);
                }
            });
        });

        describe("Process orders", function () {
            it("Create sell limit orders and buy market", async function () {
                const { coinomicon, exchange, token, owner, account1, account2 } =
                    await loadFixture(createExchangeFixture);
                const tokenToBuy = 91;

                await token.approve(exchange.address, 1000);

                for (let i = 0; i < 10; i++) {
                    await exchange.submitLimitOrder(100, 20, false);
                }

                const [available, totalCost] = await exchange.cost(tokenToBuy, 0, false, true);
                expect(available).to.equal(tokenToBuy);
                expect(totalCost).to.equal(20 * tokenToBuy);

                const initialOwnerEthBalance = await owner.getBalance();

                const initialTokenBalance = await token.balanceOf(account1.address);
                await exchange
                    .connect(account1)
                    .submitMarketOrder(tokenToBuy, true, { value: totalCost });
                expect(await token.balanceOf(account1.address)).to.equal(
                    initialTokenBalance.add(tokenToBuy)
                );
                expect(await owner.getBalance()).to.equal(initialOwnerEthBalance.add(totalCost));
                expect(await ethers.provider.getBalance(exchange.address)).to.equal(0);
            });

            it("Create sell limit orders and buy market much more than contract has", async function () {
                const { coinomicon, exchange, token, owner, account1, account2 } =
                    await loadFixture(createExchangeFixture);

                await token.approve(exchange.address, 1000);

                const tokenToBuy = 1100;

                for (let i = 0; i < 10; i++) {
                    await exchange.submitLimitOrder(100, 20, false);
                }

                const [available, totalCost] = await exchange.cost(tokenToBuy, 0, false, true);
                expect(available).to.equal(1000);
                expect(totalCost).to.equal(20 * 1000);

                const initialOwnerEthBalance = await owner.getBalance();

                const initialTokenBalance = await token.balanceOf(account1.address);
                await exchange
                    .connect(account1)
                    .submitMarketOrder(tokenToBuy, true, { value: 20 * tokenToBuy });
                expect(await token.balanceOf(account1.address)).to.equal(
                    initialTokenBalance.add(1000)
                );
                expect(await owner.getBalance()).to.equal(initialOwnerEthBalance.add(totalCost));

                const myOrderId = (await exchange.getOrderCount()).sub(1);
                const myOrder = await exchange.getOrder(myOrderId);
                expect(myOrder.active).to.equal(true);
                expect(myOrder.buy).to.equal(true);
                expect(myOrder.isLimit).to.equal(false);
                expect(myOrder.amount).to.equal(1100 - 1000);
            });

            it("Create buy limit orders and sell market", async function () {
                const { coinomicon, exchange, token, owner, account1, account2 } =
                    await loadFixture(equalTokenBalanceFixture);
                const tokenToSell = 91;

                for (let i = 0; i < 10; i++) {
                    await exchange.submitLimitOrder(100, 20, true, { value: 20 * 100 });
                }

                const [available, totalCost] = await exchange.cost(tokenToSell, 0, true, false);
                expect(available).to.equal(tokenToSell);
                expect(totalCost).to.equal(20 * tokenToSell);

                const initialExchangeBalance = await ethers.provider.getBalance(exchange.address);

                const initialTokenBalance = await token.balanceOf(owner.address);

                await token.connect(account1).approve(exchange.address, tokenToSell);
                await exchange.connect(account1).submitMarketOrder(tokenToSell, false);
                expect(await token.balanceOf(owner.address)).to.equal(
                    initialTokenBalance.add(tokenToSell)
                );
                expect(
                    initialExchangeBalance.sub(await ethers.provider.getBalance(exchange.address))
                ).to.equal(totalCost);
            });

            it("Create buy limit orders and sell market much more than contract has", async function () {
                const { coinomicon, exchange, token, owner, account1, account2 } =
                    await loadFixture(equalTokenBalanceFixture);
                const tokenToSell = 91000;

                for (let i = 0; i < 10; i++) {
                    await exchange.submitLimitOrder(100, 20, true, { value: 20 * 100 });
                }

                const [available, totalCost] = await exchange.cost(tokenToSell, 0, true, false);
                expect(available).to.equal(1000);
                expect(totalCost).to.equal(20 * 1000);

                const initialExchangeBalance = await ethers.provider.getBalance(exchange.address);

                const initialTokenBalance = await token.balanceOf(owner.address);

                await token.connect(account1).approve(exchange.address, tokenToSell);
                await exchange.connect(account1).submitMarketOrder(tokenToSell, false);
                expect(await token.balanceOf(owner.address)).to.equal(
                    initialTokenBalance.add(1000)
                );
                expect(
                    initialExchangeBalance.sub(await ethers.provider.getBalance(exchange.address))
                ).to.equal(totalCost);

                const myOrderId = (await exchange.getOrderCount()).sub(1);
                const myOrder = await exchange.getOrder(myOrderId);
                expect(myOrder.active).to.equal(true);
                expect(myOrder.buy).to.equal(false);
                expect(myOrder.isLimit).to.equal(false);
                expect(myOrder.amount).to.equal(91000 - 1000);
            });
        });

        describe("Should revert", function () {
            it("Not enough ether to submit market buy", async function () {
                const { coinomicon, exchange, token, owner, account1, account2 } =
                    await loadFixture(createExchangeFixture);
                const tokenToBuy = 91;

                await token.approve(exchange.address, 1000);

                for (let i = 0; i < 10; i++) {
                    await exchange.submitLimitOrder(100, 20, false);
                }

                const [available, totalCost] = await exchange.cost(tokenToBuy, 0, false, true);
                expect(available).to.equal(tokenToBuy);
                expect(totalCost).to.equal(20 * tokenToBuy);

                expect(
                    exchange.connect(account1).submitMarketOrder(tokenToBuy, true, { value: 100 })
                ).to.revertedWith("Unable to send ether to the trader");
            });

            it("Not enough tokens to submit market sell", async function () {
                const { coinomicon, exchange, token, owner, account1, account2 } =
                    await loadFixture(equalTokenBalanceFixture);
                const tokenToSell = 91;

                for (let i = 0; i < 10; i++) {
                    await exchange.submitLimitOrder(100, 20, true, { value: 20 * 100 });
                }

                const [available, totalCost] = await exchange.cost(tokenToSell, 0, true, false);
                expect(available).to.equal(tokenToSell);
                expect(totalCost).to.equal(20 * tokenToSell);

                await token.connect(account1).approve(exchange.address, 10);
                await expect(
                    exchange.connect(account1).submitMarketOrder(tokenToSell, false)
                ).to.revertedWith("ERC20: insufficient allowance");
            });

            it("Not enough ether to submit limit buy", async function () {
                const { coinomicon, exchange, token, owner, account1, account2 } =
                    await loadFixture(equalTokenBalanceFixture);

                await expect(
                    exchange.submitLimitOrder(100, 20, true, { value: 10 * 100 })
                ).to.revertedWith("Insufficient ETH");
            });

            it("Not enough tokens to submit limit sell", async function () {
                const { coinomicon, exchange, token, owner, account1, account2 } =
                    await loadFixture(equalTokenBalanceFixture);

                await token.approve(exchange.address, 10);
                await expect(exchange.submitLimitOrder(100, 10, false)).to.revertedWith(
                    "ERC20: insufficient allowance"
                );
            });
        });
    });
});
