import { ethers } from "hardhat";

async function main() {
    const Coinomicon = await ethers.getContractFactory("CoinomiconFactory");
    const coinomicon = await Coinomicon.deploy();

    await coinomicon.deployed();

    const CoinomiconExchangeImpl = await ethers.getContractFactory("CoinomiconExchangeImpl");
    const coinomiconExchangeImpl = await CoinomiconExchangeImpl.deploy();

    await coinomiconExchangeImpl.deployed();

    await coinomicon._setExchangeImplementation(coinomiconExchangeImpl.address);

    const TestToken = await ethers.getContractFactory("TestToken");
    const testToken = await TestToken.deploy("100000000000000000000");
    await testToken.deployed();

    await coinomicon.createExchange(testToken.address, ethers.utils.parseEther("0.0001"));

    console.log(
        `Coinomicon deployed to ${coinomicon.address}; Exchange implementation deployed to ${coinomiconExchangeImpl.address}; Test token address: ${testToken.address}`
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
