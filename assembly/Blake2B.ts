const BLAKE2B_IV = memory.data<u64>([
    0x6a09e667f3bcc908, 0xbb67ae8584caa73b,
    0x3c6ef372fe94f82b, 0xa54ff53a5f1d36f1,
    0x510e527fade682d1, 0x9b05688c2b3e6c1f,
    0x1f83d9abfb41bd6b, 0x5be0cd19137e2179
]);

const BLAKE2B_SIGMA = memory.data<u8>([
    0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
   14, 10,  4,  8,  9, 15, 13,  6,  1, 12,  0,  2, 11,  7,  5,  3,
   11,  8, 12,  0,  5,  2, 15, 13, 10, 14,  3,  6,  7,  1,  9,  4,
    7,  9,  3,  1, 13, 12, 11, 14,  2,  6,  5, 10,  4,  0, 15,  8,
    9,  0,  5,  7,  2,  4, 10, 15, 14,  1, 11, 12,  6,  8,  3, 13,
    2, 12,  6, 10,  0, 11,  8,  3,  4, 13,  7,  5, 15, 14,  1,  9,
   12,  5,  1, 15, 14, 13,  4, 10,  0,  7,  6,  3,  9,  2,  8, 11,
   13, 11,  7, 14, 12,  1,  3,  9,  5,  0, 15,  4,  8,  6,  2, 10,
    6, 15, 14,  9, 11,  3,  0,  8, 12,  2, 13,  7,  1,  4, 10,  5,
   10,  2,  8,  4,  7,  6,  1,  5, 15, 11,  9, 14,  3, 12, 13 , 0,
    0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
   14, 10,  4,  8,  9, 15, 13,  6,  1, 12,  0,  2, 11,  7,  5,  3 
]);

@inline
function GET_BLAKE2B_SIGMA(x: u32, y: u32): u8 {
    return load<u8>(BLAKE2B_SIGMA + x * 16 + y);
}

export class Blake2B {
    private static m: StaticArray<u64> = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] as StaticArray<u64>;
    private static v: StaticArray<u64> = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] as StaticArray<u64>;

    private static buffer: StaticArray<u8> = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] as StaticArray<u8>;
    private static h: StaticArray<u64> = [0,0,0,0,0,0,0,0] as StaticArray<u64>;
    private tlo: u64 = 0;
    private thi: u64 = 0;

    private buflen: u32 = 0;

    constructor(private outlen: u8) {
        memory.copy(changetype<usize>(Blake2B.h), BLAKE2B_IV, 64);
        Blake2B.h[0] ^= (outlen as u64) | (1 << 16) | (1 << 24);
    }
    
    private incrementCounter(inc: u64): void {
        this.tlo += inc;
        this.thi += (this.tlo < inc) as bool as u64;
    }

    final(out: usize): void {
        this.incrementCounter(this.buflen);

        memory.fill(changetype<usize>(Blake2B.buffer) + this.buflen, 0, 128 - this.buflen);
        this.compress(changetype<usize>(Blake2B.buffer), -1);

        memory.copy(out, changetype<usize>(Blake2B.h), this.outlen); 
        memory.fill(changetype<usize>(Blake2B.buffer), 0, 128);
    }

    update(inbuffer: usize, inlen: i32): Blake2B {
        if (inlen == 0) return this;
        let inpos = 0;

        const left = this.buflen;
        const fill = 128 - left;
        if (inlen > fill) {
            this.buflen = 0;
            memory.copy(changetype<usize>(Blake2B.buffer) + left, inbuffer, fill);
            this.incrementCounter(128);
            this.compress(changetype<usize>(Blake2B.buffer));

            inpos += fill; inlen -= fill;
            while (inlen > 128) {
                this.incrementCounter(128);
                this.compress(inbuffer + inpos);
                inpos += 128; inlen -= 128;
            }
        }

        memory.copy(changetype<usize>(Blake2B.buffer) + this.buflen, inbuffer + inpos, inlen);
        this.buflen += inlen;
        return this;
    }

    private compress(block: usize, f: u64 = 0): void {
        const m = Blake2B.m, v = Blake2B.v;

        memory.copy(changetype<usize>(m), block, 128);
        memory.copy(changetype<usize>(v), changetype<usize>(Blake2B.h), 64);

        memory.copy(changetype<usize>(v) + 64, BLAKE2B_IV, 64);

        v[12] ^= this.tlo;
        v[13] ^= this.thi;
        v[14] ^= f;

        Blake2B.ROUND(m, v,  0);
        Blake2B.ROUND(m, v,  1);
        Blake2B.ROUND(m, v,  2);
        Blake2B.ROUND(m, v,  3);
        Blake2B.ROUND(m, v,  4);
        Blake2B.ROUND(m, v,  5);
        Blake2B.ROUND(m, v,  6);
        Blake2B.ROUND(m, v,  7);
        Blake2B.ROUND(m, v,  8);
        Blake2B.ROUND(m, v,  9);
        Blake2B.ROUND(m, v, 10);
        Blake2B.ROUND(m, v, 11);

        for (let i = 0; i < 8; ++i) {
            Blake2B.h[i] ^= v[i] ^ v[i + 8];
        }
    }

    @inline
    private static ROUND(m: StaticArray<u64>, v: StaticArray<u64>, r: u32): void {
        Blake2B.G(m, v, r, 0, 0, 4,  8, 12);
        Blake2B.G(m, v, r, 1, 1, 5,  9, 13);
        Blake2B.G(m, v, r, 2, 2, 6, 10, 14);
        Blake2B.G(m, v, r, 3, 3, 7, 11, 15);
        Blake2B.G(m, v, r, 4, 0, 5, 10, 15);
        Blake2B.G(m, v, r, 5, 1, 6, 11, 12);
        Blake2B.G(m, v, r, 6, 2, 7,  8, 13);
        Blake2B.G(m, v, r, 7, 3, 4,  9, 14);
    }

    @inline
    private static G(m: StaticArray<u64>, v: StaticArray<u64>, r: u32, i: u32, ai: u32, bi: u32, ci: u32, di: u32): void {
        v[ai] = v[ai] + v[bi] + m[GET_BLAKE2B_SIGMA(r, 2*i+0)]; 
        v[di] = rotr(v[di] ^ v[ai], 32);                  
        v[ci] = v[ci] + v[di];                              
        v[bi] = rotr(v[bi] ^ v[ci], 24);                  
        v[ai] = v[ai] + v[bi] + m[GET_BLAKE2B_SIGMA(r, 2*i+1)]; 
        v[di] = rotr(v[di] ^ v[ai], 16);                  
        v[ci] = v[ci] + v[di];                              
        v[bi] = rotr(v[bi] ^ v[ci], 63);
    }
}
