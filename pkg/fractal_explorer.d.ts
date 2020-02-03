/* tslint:disable */
/* eslint-disable */
/**
*/
export function main(): void;
/**
* @param {any} ctx 
* @param {number} width 
* @param {number} height 
* @param {number} x_max 
* @param {any} x_min 
* @param {boolean} y_max 
*/
export function draw_mandel(ctx: any, width: number, height: number, x_max: number, x_min: any, y_max: boolean): void;
/**
* @param {any} ctx 
* @param {number} width 
* @param {number} height 
* @param {number} x_max 
* @param {any} x_min 
* @param {boolean} y_max 
*/
export function draw_julia(ctx: any, width: number, height: number, x_max: number, x_min: any, y_max: boolean): void;

/**
* If `module_or_path` is {RequestInfo}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {RequestInfo | BufferSource | WebAssembly.Module} module_or_path
*
* @returns {Promise<any>}
*/
export default function init (module_or_path?: RequestInfo | BufferSource | WebAssembly.Module): Promise<any>;
        