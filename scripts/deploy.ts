import { ethers } from "hardhat";

async function main() {
    const Coinomicon = await ethers.getContractFactory("CoinomiconFactory");
    const coinomicon = await Coinomicon.deploy();

    await coinomicon.deployed();

    const CoinomiconExchangeImpl = await ethers.getContractFactory("CoinomiconExchangeImpl");
    const coinomiconExchangeImpl = await CoinomiconExchangeImpl.deploy();

    await coinomiconExchangeImpl.deployed();

    await coinomicon._setExchangeImplementation(coinomiconExchangeImpl.address);

    console.log(
        `Coinomicon deployed to ${coinomicon.address}; Exchange implementation deployed to ${coinomiconExchangeImpl.address}`
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
