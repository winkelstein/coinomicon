import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
require("dotenv").config();

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.17",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    networks: {
        goerli: {
            url: "https://goerli.infura.io/v3/6874a7fbb0ac4f7c96881e168369ee49",
            accounts: [process.env.GOERLI_PRIVATE_KEY as string]
        }
    },
    etherscan: {
        apiKey: {
            goerli: process.env.GOERLISCAN_API_KEY as string
        }
    }
};

export default config;
