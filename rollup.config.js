import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import { terser } from "rollup-plugin-terser";

export default [
    {
        input: './src/index.ts',
        output: {
            file: './dist/index.esm.js',
            format: 'esm',
        },
        plugins: [typescript({module: 'esnext'}), nodeResolve(), commonjs()],
    },
    {
        input: './src/index.ts',
        output: {
            file: './dist/index.js',
            format: 'cjs',
        },
        plugins: [typescript({module: 'esnext'}), nodeResolve(), commonjs()],
    },
    {
        input: './src/index.ts',
        output: {
            file: './dist/index.min.js',
            format: 'cjs',
            sourcemap: true,
        },
        plugins: [typescript({module: 'esnext'}), nodeResolve(), commonjs(), terser()],
    },
]
