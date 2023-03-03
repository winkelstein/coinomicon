import { ethers, upgrades } from "hardhat";

async function main() {
	const Coinomicon = await ethers.getContractFactory("CoinomiconFactory");
	const coinomicon = await upgrades.deployProxy(Coinomicon, {
		initializer: "initialize"
	});

	await coinomicon.deployed();

	console.log(`Coinomicon deployed to ${coinomicon.address}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
