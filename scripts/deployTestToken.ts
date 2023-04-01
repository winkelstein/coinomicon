import { ethers } from "hardhat";

async function main() {
    const TestToken = await ethers.getContractFactory("TestToken");
    const testToken = await TestToken.deploy("100000000000000000000");
    await testToken.deployed();

    console.log(`Test token address: ${testToken.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
