import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

describe("Coinomicon", function () {
    async function deployFixture() {
        const [owner, account1, account2] = await ethers.getSigners();

        const Coinomicon = await ethers.getContractFactory("CoinomiconFactory");
        const coinomicon = await upgrades.deployProxy(Coinomicon);

        return { coinomicon, owner, account1, account2 };
    }

    async function createExchangeFixture() {
        const [owner, account1, account2] = await ethers.getSigners();

        const Coinomicon = await ethers.getContractFactory("CoinomiconFactory");
        const coinomicon = await upgrades.deployProxy(Coinomicon);

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
        const coinomicon = await upgrades.deployProxy(Coinomicon);

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
        it("Create buy orders", async function () {
            const { coinomicon, exchange, token, owner, account1, account2 } = await loadFixture(
                createExchangeFixture
            );

            for (let i = 0; i < 100; i++) {
                await expect(
                    exchange.buyLimit(i * 100, i * i, {
                        value: i * 100 * i * i
                    })
                )
                    .to.emit(exchange, "BuyOrderCreated")
                    .withArgs(i, i * 100, i * i);
            }
        });

        it("Create sell orders", async function () {
            const { coinomicon, exchange, token, owner, account1, account2 } = await loadFixture(
                createExchangeFixture
            );

            for (let i = 0; i < 100; i++) {
                await token.approve(exchange.address, 15 + i);
                await expect(exchange.sellLimit(15 + i, i))
                    .to.emit(exchange, "SellOrderCreated")
                    .withArgs(i, 15 + i, i);
            }

            expect((await exchange.marketSellPrice(100))._available).to.be.greaterThanOrEqual(100);
        });

        it("Buy market price", async function () {
            const { coinomicon, exchange, token, owner, account1, account2 } = await loadFixture(
                equalTokenBalanceFixture
            );

            for (let i = 0; i < 100; i++) {
                await token.approve(exchange.address, 150 + i);
                await token.connect(account2).approve(exchange.address, 150 + i);
                if (i % 2 == 0)
                    await expect(exchange.sellLimit(150 + i, i * i))
                        .to.emit(exchange, "SellOrderCreated")
                        .withArgs(i, 150 + i, i * i);
                else
                    await expect(exchange.connect(account2).sellLimit(150 + i, i * i))
                        .to.emit(exchange, "SellOrderCreated")
                        .withArgs(i, 150 + i, i * i);
            }

            const initialOwnerBalance = await owner.getBalance();
            const initialOwnerTokenBalance = await token.balanceOf(owner.address);
            const [available, paymentAmount] = await exchange.marketSellPrice(10000);
            expect(available).to.be.greaterThanOrEqual(10000);

            for (let i = 0; i < 10; i++) {
                const [available, _paymentAmount] = await exchange.marketSellPrice(1000);
                await exchange.connect(account1).buyMarket(1000, { value: _paymentAmount });
            }

            expect(await token.balanceOf(account1.address)).to.equal("1000000010000");
            expect(await ethers.provider.getBalance(exchange.address)).to.equal(0);
        });
    });
});
