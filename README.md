# stylus-blake2b-as

This is a demonstration of using [stylus-sdk-as](https://github.com/romdotdog/stylus-sdk-as) to build and deploy a smart contract written in AssemblyScript. This is a basic BLAKE2b hasher ported over from [the C reference implementation](https://github.com/BLAKE2/BLAKE2/blob/master/ref/blake2b-ref.c) that can be invoked using the following ABI:

```
function hash(string input) view returns (string)
```

## To use

Make a `.env` file and fill in your private key below:

```
ADDRESS="0xee13677726676170e6998d97f6a6069792f15a2a"
PRIVATE_KEY=""
RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
```

### Example output

Running `node tests/index.js` (which hashes the string `blake2b`) yields

```
3e09c77c1e28d7c72c3e8ac87d9ff4e549495abc842baebe65bea66fb1a488ddb739d563ab0122a0704e9d29361d849592f65c55ebcf5017bf0bf1956583d6e0
```

## To build/deploy

Clone the `stylus-sdk-as` repository, run `npm i`, `npx tsc`, and then `npm pack`. Copy over the tar file to this repository and run `npm i <tar file>`. After that, run `npm run asbuild:release` and you can deploy it using the `--wasm-file` flag of `cargo stylus deploy`.