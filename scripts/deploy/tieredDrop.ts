import "dotenv/config";
// import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { readFileSync, writeFileSync } from "fs";
import { ethers, BytesLike } from "ethers";
import { JsonFragment } from "@ethersproject/abi";

// import { TieredDrop } from "typechain";

////// To run this script: `npx ts-node scripts/deploy/tieredDrop.ts` //////

// ========== Types ==========

type PluginMetadata = {
    name: string;
    metadataURI: string;
    implementation: string;
}

type PluginFunction = {
    functionSelector: BytesLike;
    functionSignature: string;
}

type Plugin = {
    metadata: PluginMetadata;
    functions: PluginFunction[];
}

// ========== Constants ==========

const PRIVATE_KEY: string = process.env.TEST_PRIVATE_KEY as string;
// const NETWORK: string = "goerli";

// TODO: add implementation addresses for each plugin.
const PLUGIN_METADATA = {
    "TieredDropLogic": {
        name: "TieredDropLogic",
        metadataURI: "",
        implementation: "0x38fb0D6E09Cfcf2B8a6c8b6B28994E208726deA3"
    },
    "PermissionsEnumerable": {
        name: "PermissionsEnumerable",
        metadataURI: "",
        implementation: "0xEe63992e7AaE8578E7239991960F7494F8dFF005"
    }
}

function getABI(contractName: string): JsonFragment[] {
    return JSON.parse(
        readFileSync(`artifacts_forge/${contractName}.sol/${contractName}.json`, "utf-8"),
    ).abi;
}

function getBytecode(contractName: string) {
    return JSON.parse(
        readFileSync(`artifacts_forge/${contractName}.sol/${contractName}.json`, "utf-8"),
    ).bytecode;
}

function generatePluginParam(pluginName: string): Plugin {

    const abi = getABI(pluginName);
    
    const pluginInterface = new ethers.utils.Interface(abi);
    
    const pluginMetadata: PluginMetadata = PLUGIN_METADATA[pluginName as keyof typeof PLUGIN_METADATA];
    const pluginFunctions: PluginFunction[] = [];

    const fragments = pluginInterface.functions;
    for (const fnSignature of Object.keys(fragments)) {
        pluginFunctions.push({
            functionSelector: pluginInterface.getSighash(fragments[fnSignature]),
            functionSignature: fnSignature
        });
    }

    return {
        metadata: pluginMetadata,
        functions: pluginFunctions
    }
}

async function main() {
    
    const plugins: Plugin[] = [];
    for(const x of Object.keys(PLUGIN_METADATA)) {
        plugins.push(generatePluginParam(x));
    }
    
    const output = JSON.stringify(plugins, undefined, 2);
    writeFileSync("scripts/deploy/tdPlugins.json", output, "utf-8");

    // const sdk = ThirdwebSDK.fromPrivateKey(PRIVATE_KEY, NETWORK);
    // const abi = getABI("TieredDrop");
    // const bytecode = getBytecode("TieredDrop");
    
    // const tieredDrop = await sdk.deployer.deployContractWithAbi(abi, bytecode, [plugins]);
    
    // console.log("TieredDrop address: ", tieredDrop);
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });