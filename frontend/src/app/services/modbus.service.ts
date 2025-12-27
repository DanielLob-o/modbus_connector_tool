import { Injectable } from '@angular/core';
import { ConnectTCP, ConnectRTU, Disconnect, ReadCoils, ReadDiscreteInputs, ReadHoldingRegisters, ReadInputRegisters, WriteSingleCoil, WriteSingleRegister, WriteMultipleCoils, WriteMultipleRegisters, MaskWriteRegister, ReadWriteMultipleRegisters, ReadFIFOQueue } from '../../../wailsjs/go/main/ModbusController';

@Injectable({
    providedIn: 'root'
})
export class ModbusService {

    constructor() { }

    async connectTCP(address: string): Promise<string> {
        return ConnectTCP(address);
    }

    async connectRTU(address: string, baudRate: number, dataBits: number, stopBits: number, parity: string): Promise<string> {
        return ConnectRTU(address, baudRate, dataBits, stopBits, parity);
    }

    async disconnect(): Promise<string> {
        return Disconnect();
    }

    async readCoils(address: number, quantity: number): Promise<number[]> {
        const res = await ReadCoils(address, quantity);
        return this.handleResponse(res);
    }

    async readDiscreteInputs(address: number, quantity: number): Promise<number[]> {
        const res = await ReadDiscreteInputs(address, quantity);
        return this.handleResponse(res);
    }

    async readHoldingRegisters(address: number, quantity: number): Promise<number[]> {
        const res = await ReadHoldingRegisters(address, quantity);
        return this.handleResponse(res);
    }

    async readInputRegisters(address: number, quantity: number): Promise<number[]> {
        const res = await ReadInputRegisters(address, quantity);
        return this.handleResponse(res);
    }

    async writeSingleCoil(address: number, value: number): Promise<number[]> {
        const res = await WriteSingleCoil(address, value);
        return this.handleResponse(res);
    }

    async writeSingleRegister(address: number, value: number): Promise<number[]> {
        const res = await WriteSingleRegister(address, value);
        return this.handleResponse(res);
    }

    async writeMultipleCoils(address: number, bits: number[]): Promise<number[]> {
        // Pack bits into bytes for Modbus
        const quantity = bits.length;
        const bytesNeeded = Math.ceil(quantity / 8);
        const packed = new Array(bytesNeeded).fill(0);

        for (let i = 0; i < quantity; i++) {
            if (bits[i]) {
                const byteIndex = Math.floor(i / 8);
                const bitIndex = i % 8;
                packed[byteIndex] |= (1 << bitIndex);
            }
        }

        // Pass the packed bytes (Wails handles number[] -> []byte usually)
        const res = await WriteMultipleCoils(address, quantity, packed);
        return this.handleResponse(res);
    }

    async writeMultipleRegisters(address: number, values: number[]): Promise<number[]> {
        // Pack 16-bit words into bytes (Big Endian)
        const quantity = values.length;
        const packed = new Array(quantity * 2);

        for (let i = 0; i < quantity; i++) {
            const val = values[i];
            packed[i * 2] = (val >> 8) & 0xFF;     // High Byte
            packed[i * 2 + 1] = val & 0xFF;        // Low Byte
        }

        const res = await WriteMultipleRegisters(address, quantity, packed);
        return this.handleResponse(res);
    }

    private handleResponse(res: any): number[] {
        if (typeof res === 'string') {
            return this.base64ToBytes(res);
        } else if (Array.isArray(res)) {
            return res;
        }
        return [];
    }

    private base64ToBytes(base64: string): number[] {
        if (!base64) return [];
        const binary_string = window.atob(base64);
        const len = binary_string.length;
        const bytes = new Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes;
    }

    private bytesToBase64(bytes: number[]): string {
        let binary = '';
        const len = bytes.length;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }
}
