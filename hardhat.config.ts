import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();

const config: HardhatUserConfig = process.env.PRIVATE_KEY
    ? {
          solidity: {
              version: "0.8.17",
              settings: {
                  optimizer: {
                      enabled: true,
                      runs: 200
                  }
              }
          },
          defaultNetwork: "hardhat",
          networks: {
              hardhat: {},
              goerli: {
                  url: "https://goerli.infura.io/v3/6874a7fbb0ac4f7c96881e168369ee49",
                  accounts: [process.env.PRIVATE_KEY as string]
              }
          },
          etherscan: {
              apiKey: {
                  goerli: process.env.ETHERSCAN_API_KEY as string
              }
          }
      }
    : {
          solidity: {
              version: "0.8.17",
              settings: {
                  optimizer: {
                      enabled: true,
                      runs: 200
                  }
              }
          }
      };

export default config;
