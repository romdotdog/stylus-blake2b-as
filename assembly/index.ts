import { Contract } from "../node_modules/stylus-sdk-as/assembly/index";
import { Blake2B } from "./Blake2B";

const hexMap = [0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x61, 0x62, 0x63, 0x64, 0x65, 0x66] as StaticArray<u8>;

export class HashContract extends Contract {
    hash(input: string): string {
        const bytes = String.UTF8.encode(input);
        const digest = new StaticArray<u8>(64);
        new Blake2B(64).update(changetype<usize>(bytes), bytes.byteLength).final(changetype<usize>(digest));
        const strPtr = __new(256, idof<String>());
        for (let i = 0; i < 64; i++) {
            const byte = digest[i], base = strPtr + i * 4;
            store<u8>(base, hexMap[(byte >> 4) & 0xf]);
            store<u8>(base + 2, hexMap[byte & 0xf]);
        }
        return changetype<string>(strPtr);
    }
}