import { config } from "dotenv";
import { ethers } from "ethers";

config({ path: ".env" });

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.NonceManager(new ethers.Wallet(process.env.PRIVATE_KEY, provider));
const contract = new ethers.Contract(process.env.ADDRESS, ["function hash(string input) view returns (string)"], signer);

console.log(await contract.hash("blake2b"));