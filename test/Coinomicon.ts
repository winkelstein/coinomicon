import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Coinomicon", function () {
    async function deployFixture() {
        const [owner, account1, account2] = await ethers.getSigners();

        const Coinomicon = await ethers.getContractFactory("CoinomiconFactory");
        const coinomicon = await Coinomicon.deploy();

        return { coinomicon, owner, account1, account2 };
    }

    async function createExchangeFixture() {
        const [owner, account1, account2] = await ethers.getSigners();

        const Coinomicon = await ethers.getContractFactory("CoinomiconFactory");
        const coinomicon = await Coinomicon.deploy();

        const Token = await ethers.getContractFactory("TestToken");
        const token = await Token.deploy("1000000000000");

        const ExchangeContract = await ethers.getContractFactory("CoinomiconExchange");
        await coinomicon.createExchange(token.address);
        const exchangeAddress = await coinomicon.getExchange(token.address);
        const exchange = await ExchangeContract.attach(exchangeAddress);

        return { coinomicon, exchange, token, owner, account1, account2 };
    }

    async function equalTokenBalanceFixture() {
        const [owner, account1, account2] = await ethers.getSigners();

        const Coinomicon = await ethers.getContractFactory("CoinomiconFactory");
        const coinomicon = await Coinomicon.deploy();

        const Token = await ethers.getContractFactory("TestToken");
        const token = await Token.deploy("3000000000000");
        token.transfer(account1.address, "1000000000000");
        token.transfer(account2.address, "1000000000000");

        const ExchangeContract = await ethers.getContractFactory("CoinomiconExchange");
        await coinomicon.createExchange(token.address);
        const exchangeAddress = await coinomicon.getExchange(token.address);
        const exchange = await ExchangeContract.attach(exchangeAddress);

        return { coinomicon, exchange, token, owner, account1, account2 };
    }

    describe("Deployment", function () {
        it("Deploy and create new exchange", async function () {
            const { coinomicon, owner, account1, account2 } = await loadFixture(deployFixture);

            const Token = await ethers.getContractFactory("TestToken");
            const token = await Token.deploy("1000000000");

            await expect(coinomicon.createExchange(token.address)).to.emit(
                coinomicon,
                "ExchangeCreated"
            );
        });

        it("Get created exchange address", async function () {
            const { coinomicon, owner, account1, account2 } = await loadFixture(deployFixture);

            const Token = await ethers.getContractFactory("TestToken");
            const token = await Token.deploy("1000000000");

            await coinomicon.createExchange(token.address);

            const ExchangeContract = await ethers.getContractFactory("CoinomiconExchange");
            const exchangeAddress = await coinomicon.getExchange(token.address);
            const exchange = await ExchangeContract.attach(exchangeAddress);

            expect(await exchange.token()).to.equal(token.address);
        });

        it("Bad tests", async function () {
            const { coinomicon, owner, account1, account2 } = await loadFixture(deployFixture);

            const Token = await ethers.getContractFactory("TestToken");
            const token = await Token.deploy("1000000000");

            await coinomicon.createExchange(token.address);

            await expect(coinomicon.createExchange(token.address)).to.be.revertedWith(
                "Exchange already exists"
            );
            await expect(
                coinomicon.createExchange("0x0000000000000000000000000000000000000000")
            ).to.be.revertedWith("Invalid token address");
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
                const initialOwnerEthBalance = await owner.getBalance();

                const initialTokenBalance = await token.balanceOf(account1.address);
                await exchange
                    .connect(account1)
                    .submitMarketOrder(tokenToBuy, true, { value: 20 * tokenToBuy });
                expect(await token.balanceOf(account1.address)).to.equal(
                    initialTokenBalance.add(tokenToBuy)
                );
                expect(await owner.getBalance()).to.equal(
                    initialOwnerEthBalance.add(20 * tokenToBuy)
                );
                expect(await ethers.provider.getBalance(exchange.address)).to.equal(0);
            });

            it("Create sell limit orders and buy market much more than contract has", async function () {
                const { coinomicon, exchange, token, owner, account1, account2 } =
                    await loadFixture(createExchangeFixture);

                await token.approve(exchange.address, 1000);

                for (let i = 0; i < 10; i++) {
                    await exchange.submitLimitOrder(100, 20, false);
                }
                const initialOwnerEthBalance = await owner.getBalance();

                const initialTokenBalance = await token.balanceOf(account1.address);
                await exchange
                    .connect(account1)
                    .submitMarketOrder(1100, true, { value: 20 * 1100 });
                expect(await token.balanceOf(account1.address)).to.equal(
                    initialTokenBalance.add(1000)
                );
                expect(await owner.getBalance()).to.equal(initialOwnerEthBalance.add(20 * 1000));
            });

            it("Create buy limit orders and sell market", async function () {
                const { coinomicon, exchange, token, owner, account1, account2 } =
                    await loadFixture(equalTokenBalanceFixture);
                const tokenToSell = 91;

                for (let i = 0; i < 10; i++) {
                    await exchange.submitLimitOrder(100, 20, true, { value: 20 * 100 });
                }

                const initialExchangeBalance = await ethers.provider.getBalance(exchange.address);

                const initialTokenBalance = await token.balanceOf(owner.address);

                await token.connect(account1).approve(exchange.address, tokenToSell);
                await exchange.connect(account1).submitMarketOrder(tokenToSell, false);
                expect(await token.balanceOf(owner.address)).to.equal(
                    initialTokenBalance.add(tokenToSell)
                );
                expect(
                    initialExchangeBalance.sub(await ethers.provider.getBalance(exchange.address))
                ).to.equal(tokenToSell * 20);
            });

            it("Create buy limit orders and sell market much more than contract has", async function () {
                const { coinomicon, exchange, token, owner, account1, account2 } =
                    await loadFixture(equalTokenBalanceFixture);
                const tokenToSell = 91000;

                for (let i = 0; i < 10; i++) {
                    await exchange.submitLimitOrder(100, 20, true, { value: 20 * 100 });
                }

                const initialExchangeBalance = await ethers.provider.getBalance(exchange.address);

                const initialTokenBalance = await token.balanceOf(owner.address);

                await token.connect(account1).approve(exchange.address, tokenToSell);
                await exchange.connect(account1).submitMarketOrder(tokenToSell, false);
                expect(await token.balanceOf(owner.address)).to.equal(
                    initialTokenBalance.add(1000)
                );
                expect(
                    initialExchangeBalance.sub(await ethers.provider.getBalance(exchange.address))
                ).to.equal(1000 * 20);
            });
        });
    });
});
