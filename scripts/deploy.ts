import { ethers } from "hardhat";

async function main() {
    const Coinomicon = await ethers.getContractFactory("CoinomiconFactory");
    const coinomicon = await Coinomicon.deploy();

    await coinomicon.deployed();

    console.log(`Coinomicon deployed to ${coinomicon.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
